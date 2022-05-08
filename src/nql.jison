%{
  const Compiler = require('./compiler')
%}

%%

expression
  : CHILD expression { $$ = new Compiler.Expression({ rest: $2, relationship: 'child' }); yy.parser.yy.result = $$ }
  | selector expression { $$ = new Compiler.Expression({ selector: $1, rest: $2 }); yy.parser.yy.result = $$ }
  | selector { $$ = new Compiler.Expression({ selector: $1 }); yy.parser.yy.result = $$ }
  ;

selector
  : NODE_TYPE attribute_list INDEX { $$ = new Compiler.Selector({ nodeType: $1, attributeList: $2, index: $3 }) }
  | NODE_TYPE INDEX { $$ = new Compiler.Selector({ nodeType: $1, index: $2 }) }
  | NODE_TYPE attribute_list { $$ = new Compiler.Selector({ nodeType: $1, attributeList: $2 }) }
  | NODE_TYPE { $$ = new Compiler.Selector({ nodeType: $1 }) }
  ;

attribute_list
  : OPEN_ATTRIBUTE attribute CLOSE_ATTRIBUTE attribute_list { $$ = new Compiler.AttributeList({ attribute: $2, rest: $4 }) }
  | OPEN_ATTRIBUTE attribute CLOSE_ATTRIBUTE { $$ = new Compiler.AttributeList({ attribute: $2 }) }
  ;

attribute
  : KEY $OPERATOR OPEN_ARRAY array_value CLOSE_ARRAY { $$ = new Compiler.Attribute({ key: $1, value: $4, operator: $2 }) }
  | KEY OPERATOR value { $$ = new Compiler.Attribute({ key: $1, value: $3, operator: $2 }) }
  ;

array_value
  : value array_value { $$ = new Compiler.ArrayValue({ value: $1, rest: $2 }) }
  | value { $$ = new Compiler.ArrayValue({ value: $1 }) }
  ;

value
  : selector
  | NULL { $$ = new Compiler.Null() }
  | UNDEFINED { $$ = new Compiler.Undefined() }
  | BOOLEAN { $$ = new Compiler.Boolean($1) }
  | NUMBER { $$ = new Compiler.Number($1) }
  | STRING { $$ = new Compiler.String($1) }
  | IDENTIFIER_VALUE { $$ = new Compiler.Identifier($1) }
  ;

%%