; Captures for TypeScript, TSX and JavaScript. Node kinds are shared across
; the three grammars, so one query file serves all of them. Classification
; into SymbolKind happens in src/code/symbols.ts, which needs the surrounding
; file path to tell a Next.js page from an ordinary component.

(function_declaration) @function

(generator_function_declaration) @function

; module.exports.shippingFor = function shippingFor() {}
(function_expression name: (identifier)) @function

(variable_declarator
  value: [(arrow_function) (function_expression)]) @const_function

(class_declaration) @class

(method_definition) @method

; router.get("/x", handler), app.use(...), z.object({...}), isEnabled("flag")
(call_expression) @call

; process.env.DATABASE_URL
(member_expression
  object: (member_expression
    object: (identifier) @env_object
    property: (property_identifier) @env_property)
  property: (property_identifier) @env_name) @env_read
