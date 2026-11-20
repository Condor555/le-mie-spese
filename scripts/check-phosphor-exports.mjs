import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const phosphor = require('@phosphor-icons/react/ssr');

const root = process.cwd();
const sourceRoots = ['app', 'components', 'lib'];
const files = [];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const fullPath = join(dir, name);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      walk(fullPath);
    } else if (/\.(?:ts|tsx)$/.test(name)) {
      files.push(fullPath);
    }
  }
}

for (const folder of sourceRoots) {
  try {
    walk(join(root, folder));
  } catch {
    // La cartella può non essere presente.
  }
}

const required = new Map();
const validModules = new Set([
  '@phosphor-icons/react',
  '@phosphor-icons/react/ssr',
]);

for (const file of files) {
  const sourceText = readFileSync(file, 'utf8');

  const sourceFile = ts.createSourceFile(
    file,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );

  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement)) continue;
    if (!ts.isStringLiteral(statement.moduleSpecifier)) continue;

    const moduleName = statement.moduleSpecifier.text;

    if (!validModules.has(moduleName)) continue;

    const importClause = statement.importClause;
    const namedBindings = importClause?.namedBindings;

    if (!namedBindings || !ts.isNamedImports(namedBindings)) continue;

    for (const element of namedBindings.elements) {
      const exportedName = element.propertyName?.text ?? element.name.text;

      if (!required.has(exportedName)) {
        required.set(exportedName, []);
      }

      required.get(exportedName).push(relative(root, file));
    }
  }
}

const missing = [...required.entries()].filter(
  ([exportName]) => !(exportName in phosphor),
);

if (missing.length > 0) {
  console.error('\nPhosphor 2.1.10: export mancanti rilevati:');

  for (const [name, locations] of missing) {
    console.error(
      `- ${name} (${[...new Set(locations)].join(', ')})`,
    );
  }

  console.error(
    '\nCorreggere tutti i nomi prima della compilazione Next.js.',
  );

  process.exit(1);
}

if (required.has('Safe')) {
  console.error(
    'L’export non supportato Safe è ancora importato. ' +
      'Usare PiggyBankIcon per l’identificatore salvato "safe".',
  );

  process.exit(1);
}

console.log(
  `Phosphor 2.1.10 export check OK: ${required.size} ` +
    'import nominati verificati.',
);
