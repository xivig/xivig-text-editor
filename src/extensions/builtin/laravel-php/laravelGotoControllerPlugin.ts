import { ControllerLocationResult } from './types';

/**
 * Resolves a Laravel Route action to its controller class and method.
 * Handles:
 * - Tuple: Route::get('/users', [UserController::class, 'index']);
 * - String: Route::get('/users', 'UserController@index');
 * - Sub-namespace: Route::get('/api', [App\Http\Controllers\Api\UserController::class, 'show']);
 */
export function resolveControllerAction(routeLine: string): { controllerClass: string; method: string } | null {
  if (!routeLine) return null;

  // 1. Match tuple: [UserController::class, 'index']
  const tupleMatch = routeLine.match(/\[\s*([a-zA-Z0-9_\\]+)::class\s*,\s*['"]([a-zA-Z0-9_]+)['"]\s*\]/);
  if (tupleMatch) {
    return {
      controllerClass: tupleMatch[1].replace(/^\\/, ''),
      method: tupleMatch[2],
    };
  }

  // 2. Match string format: 'UserController@index'
  const stringMatch = routeLine.match(/['"]([a-zA-Z0-9_\\]+)@([a-zA-Z0-9_]+)['"]/);
  if (stringMatch) {
    return {
      controllerClass: stringMatch[1].replace(/^\\/, ''),
      method: stringMatch[2],
    };
  }

  return null;
}

/**
 * Computes possible relative file paths for a controller in a standard Laravel project structure.
 */
export function computeControllerFilePath(
  controllerClass: string,
  basePath = 'app/Http/Controllers'
): ControllerLocationResult {
  const cleanClass = controllerClass.replace(/^App\\Http\\Controllers\\/, '').replace(/\\/g, '/');
  const filename = cleanClass.endsWith('.php') ? cleanClass : `${cleanClass}.php`;
  const normalizedBasePath = basePath.replace(/\\/g, '/').replace(/\/$/, '');

  const standardPath = `${normalizedBasePath}/${filename}`;

  return {
    controllerName: cleanClass.split('/').pop()?.replace('.php', '') || controllerClass,
    possibleFilePaths: [standardPath],
  };
}
