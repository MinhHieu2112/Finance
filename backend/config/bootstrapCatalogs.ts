import Catalog from '../models/Catalog';
import catalogsConfig from './catalogs.json';

export async function bootstrapCatalogs(): Promise<void> {
  const ops = catalogsConfig.map(catalog =>
    Catalog.updateOne(
      { type: catalog.type, name: catalog.name },
      { $setOnInsert: catalog },
      { upsert: true }
    )
  );

  await Promise.all(ops);
  console.log(`[bootstrap] Catalogs: ${catalogsConfig.length} nhóm đã được đảm bảo tồn tại.`);
}
