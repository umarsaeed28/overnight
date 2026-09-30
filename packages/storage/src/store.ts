import {
  CreateBucketCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadBucketCommand,
  ListObjectsV2Command,
  PutBucketVersioningCommand,
  PutObjectCommand,
  S3Client,
  type S3ClientConfig,
} from "@aws-sdk/client-s3";

export interface ObjectStoreOptions {
  endpoint?: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  /** MinIO needs path style; real S3 does not care. */
  forcePathStyle?: boolean;
  client?: S3Client;
}

/** Deleting more than this per request is rejected by S3. */
const DELETE_BATCH = 1000;

export class ObjectStore {
  readonly bucket: string;
  readonly #client: S3Client;

  constructor(options: ObjectStoreOptions) {
    this.bucket = options.bucket;

    const config: S3ClientConfig = {
      region: options.region,
      credentials: {
        accessKeyId: options.accessKeyId,
        secretAccessKey: options.secretAccessKey,
      },
      ...(options.endpoint ? { endpoint: options.endpoint } : {}),
      forcePathStyle: options.forcePathStyle ?? Boolean(options.endpoint),
    };

    this.#client = options.client ?? new S3Client(config);
  }

  /** Idempotent: creates the bucket with versioning on if it is not there. */
  async ensureBucket(): Promise<void> {
    try {
      await this.#client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      return;
    } catch {
      // Falls through to creation; a genuine permissions problem surfaces below.
    }

    await this.#client.send(new CreateBucketCommand({ Bucket: this.bucket }));
    await this.#client.send(
      new PutBucketVersioningCommand({
        Bucket: this.bucket,
        VersioningConfiguration: { Status: "Enabled" },
      }),
    );
  }

  async putText(key: string, body: string, contentType = "text/plain; charset=utf-8"): Promise<void> {
    await this.#client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
  }

  async getText(key: string): Promise<string | undefined> {
    try {
      const response = await this.#client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      return await response.Body?.transformToString("utf8");
    } catch (error) {
      if (isNotFound(error)) return undefined;
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    return (await this.getText(key)) !== undefined;
  }

  async *listKeys(prefix: string): AsyncIterable<string> {
    let token: string | undefined;

    do {
      const page = await this.#client.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: prefix,
          ContinuationToken: token,
        }),
      );

      for (const object of page.Contents ?? []) {
        if (object.Key) yield object.Key;
      }

      token = page.IsTruncated ? page.NextContinuationToken : undefined;
    } while (token);
  }

  /** Used by workspace deletion. Returns how many objects went. */
  async deletePrefix(prefix: string): Promise<number> {
    let batch: string[] = [];
    let deleted = 0;

    const flush = async () => {
      if (batch.length === 0) return;
      await this.#client.send(
        new DeleteObjectsCommand({
          Bucket: this.bucket,
          Delete: { Objects: batch.map((Key) => ({ Key })) },
        }),
      );
      deleted += batch.length;
      batch = [];
    };

    for await (const key of this.listKeys(prefix)) {
      batch.push(key);
      if (batch.length === DELETE_BATCH) await flush();
    }
    await flush();

    return deleted;
  }
}

function isNotFound(error: unknown): boolean {
  const name = (error as { name?: string })?.name;
  const status = (error as { $metadata?: { httpStatusCode?: number } })?.$metadata?.httpStatusCode;
  return name === "NoSuchKey" || name === "NotFound" || status === 404;
}
