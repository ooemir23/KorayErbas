// @vercel/postgres SDK'sı:
//  - `sql` : global pool, tekil sorgu (template literal). process.env'den bağlanır.
//            Aynı zamanda VercelPool olduğu için .connect() ve .query() destekler.
//  - `db`  : sql ile aynı (alias).
// Transaction için `sql.connect()` ile client alıp BEGIN/COMMIT yönetiriz.
export { sql } from "@vercel/postgres";
