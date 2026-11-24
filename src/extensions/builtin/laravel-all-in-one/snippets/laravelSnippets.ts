import { snippetCompletion, Completion } from '@codemirror/autocomplete';

export const laravelSnippets: Completion[] = [
  // --- ROUTING ---
  snippetCompletion(
    "Route::get('\${1:uri}', [\${2:Controller}::class, '\${3:index}'])->name('\${4:name}');",
    {
      label: 'route-get',
      detail: 'Laravel Route::get Definition',
      info: 'Register a GET route with controller action and route name.',
      type: 'snippet',
    }
  ),
  snippetCompletion(
    "Route::post('\${1:uri}', [\${2:Controller}::class, '\${3:store}'])->name('\${4:name}');",
    {
      label: 'route-post',
      detail: 'Laravel Route::post Definition',
      info: 'Register a POST route for form submissions or resource creation.',
      type: 'snippet',
    }
  ),
  snippetCompletion(
    "Route::put('\${1:uri}/{\${2:id}}', [\${3:Controller}::class, '\${4:update}']);",
    {
      label: 'route-put',
      detail: 'Laravel Route::put Definition',
      type: 'snippet',
    }
  ),
  snippetCompletion(
    "Route::delete('\${1:uri}/{\${2:id}}', [\${3:Controller}::class, '\${4:destroy}']);",
    {
      label: 'route-delete',
      detail: 'Laravel Route::delete Definition',
      type: 'snippet',
    }
  ),
  snippetCompletion(
    "Route::resource('\${1:items}', \${2:ItemController}::class);",
    {
      label: 'route-resource',
      detail: 'Laravel Route::resource',
      info: 'Register all 7 standard CRUD routes for a web resource.',
      type: 'snippet',
    }
  ),
  snippetCompletion(
    "Route::apiResource('\${1:items}', \${2:ItemController}::class);",
    {
      label: 'route-api-resource',
      detail: 'Laravel Route::apiResource',
      info: 'Register 5 API CRUD routes (excludes create and edit forms).',
      type: 'snippet',
    }
  ),
  snippetCompletion(
    "Route::middleware([\${1:'auth'}])->group(function () {\n\t\${2}\n});",
    {
      label: 'route-middleware-group',
      detail: 'Laravel Route Group with Middleware',
      type: 'snippet',
    }
  ),
  snippetCompletion(
    "Route::prefix('\${1:admin}')->group(function () {\n\t\${2}\n});",
    {
      label: 'route-prefix-group',
      detail: 'Laravel Route Group with Prefix',
      type: 'snippet',
    }
  ),

  // --- ELOQUENT RELATIONSHIPS ---
  snippetCompletion(
    `public function \${1:items}(): \\Illuminate\\Database\\Eloquent\\Relations\\HasMany
{
\treturn $this->hasMany(\${2:Item}::class);
}`,
    {
      label: 'eloquent-has-many',
      detail: 'Eloquent: hasMany Relationship',
      info: 'Define a one-to-many relationship method.',
      type: 'snippet',
    }
  ),
  snippetCompletion(
    `public function \${1:user}(): \\Illuminate\\Database\\Eloquent\\Relations\\BelongsTo
{
\treturn $this->belongsTo(\${2:User}::class);
}`,
    {
      label: 'eloquent-belongs-to',
      detail: 'Eloquent: belongsTo Relationship',
      info: 'Define an inverse one-to-one or one-to-many relationship.',
      type: 'snippet',
    }
  ),
  snippetCompletion(
    `public function \${1:profile}(): \\Illuminate\\Database\\Eloquent\\Relations\\HasOne
{
\treturn $this->hasOne(\${2:Profile}::class);
}`,
    {
      label: 'eloquent-has-one',
      detail: 'Eloquent: hasOne Relationship',
      type: 'snippet',
    }
  ),
  snippetCompletion(
    `public function \${1:roles}(): \\Illuminate\\Database\\Eloquent\\Relations\\BelongsToMany
{
\treturn $this->belongsToMany(\${2:Role}::class);
}`,
    {
      label: 'eloquent-belongs-to-many',
      detail: 'Eloquent: belongsToMany (Many-to-Many)',
      type: 'snippet',
    }
  ),
  snippetCompletion(
    `public function scope\${1:Active}($query)
{
\treturn $query->where('\${2:is_active}', true);
}`,
    {
      label: 'eloquent-scope',
      detail: 'Eloquent: Local Query Scope',
      info: 'Define a reusable query constraint method on a model.',
      type: 'snippet',
    }
  ),
  snippetCompletion(
    `protected $fillable = [
\t'\${1:title}',
\t'\${2:content}',
];`,
    {
      label: 'eloquent-fillable',
      detail: 'Eloquent: Mass Assignment $fillable',
      type: 'snippet',
    }
  ),
  snippetCompletion(
    `protected function casts(): array
{
\treturn [
\t\t'\${1:is_active}' => 'boolean',
\t\t'\${2:published_at}' => 'datetime',
\t];
}`,
    {
      label: 'eloquent-casts',
      detail: 'Eloquent: Model Attribute Type Casts (Laravel 11+)',
      type: 'snippet',
    }
  ),

  // --- MIGRATIONS & SCHEMA ---
  snippetCompletion(
    `Schema::create('\${1:table_name}', function (Blueprint $table) {
\t$table->id();
\t$table->string('\${2:name}');
\t$table->timestamps();
});`,
    {
      label: 'migration-create',
      detail: 'Schema::create Migration Blueprint',
      info: 'Generate a new database table schema blueprint.',
      type: 'snippet',
    }
  ),
  snippetCompletion(
    `Schema::table('\${1:table_name}', function (Blueprint $table) {
\t$table->\${2:string}('\${3:column_name}');
});`,
    {
      label: 'migration-table',
      detail: 'Schema::table Alter Table Blueprint',
      type: 'snippet',
    }
  ),
  snippetCompletion(
    "$table->foreignId('\${1:user_id}')->constrained()->cascadeOnDelete();",
    {
      label: 'col-foreign-id',
      detail: 'Migration: Foreign Key ID Column',
      info: 'Create an unsignedBigInteger foreign key with cascade on delete.',
      type: 'snippet',
    }
  ),
  snippetCompletion(
    "$table->string('\${1:title}', \${2:255});",
    {
      label: 'col-string',
      detail: 'Migration: VARCHAR Column',
      type: 'snippet',
    }
  ),
  snippetCompletion(
    "$table->text('\${1:body}')->nullable();",
    {
      label: 'col-text',
      detail: 'Migration: TEXT Column',
      type: 'snippet',
    }
  ),
  snippetCompletion(
    "$table->boolean('\${1:is_active}')->default(\${2:false});",
    {
      label: 'col-boolean',
      detail: 'Migration: BOOLEAN Column with Default',
      type: 'snippet',
    }
  ),

  // --- CONTROLLERS & FORM REQUESTS ---
  snippetCompletion(
    `public function rules(): array
{
\treturn [
\t\t'\${1:title}' => ['required', 'string', 'max:255'],
\t\t'\${2:email}' => ['required', 'email', 'unique:users,email'],
\t];
}`,
    {
      label: 'request-rules',
      detail: 'FormRequest: Validation rules() Method',
      type: 'snippet',
    }
  ),

  // --- HELPERS & RESPONSES ---
  snippetCompletion("return response()->json([\n\t'\${1:message}' => '\${2:Success}',\n], \${3:200});", {
    label: 'response-json',
    detail: 'Laravel: Return JSON HTTP Response',
    type: 'snippet',
  }),
  snippetCompletion("return redirect()->route('\${1:home}')->with('\${2:success}', '\${3:Operation completed successfully}');", {
    label: 'redirect-route',
    detail: 'Laravel: Redirect to Route with Flash Message',
    type: 'snippet',
  }),
  snippetCompletion('dd(\${\${1:variable}});', {
    label: 'dd',
    detail: 'Laravel: Dump and Die Helper',
    info: 'Dump variables and immediately terminate script execution.',
    type: 'snippet',
  }),
  snippetCompletion('dump(\${\${1:variable}});', {
    label: 'dump',
    detail: 'Laravel: Dump Variable Helper',
    type: 'snippet',
  }),
  snippetCompletion("abort(\${1:404}, '\${2:Resource not found}');", {
    label: 'abort',
    detail: 'Laravel: Abort with HTTP Status Code',
    type: 'snippet',
  }),
];
