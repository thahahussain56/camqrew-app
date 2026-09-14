const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.lwvmtjraqvniknstcvpk:Adgjmpu123%40%23@aws-0-ap-south-1.pooler.supabase.com:6543/postgres' });
async function testInsert() {
  await client.connect();
  try {
    const res = await client.query(
      INSERT INTO public.users (id, name, email, phone, role)
      VALUES ('test-uuid-1234', 'Thaha Zakir', 'thahazakir@gmail.com', '9731627660', 'customer');
    );
    console.log("Insert success!");
  } catch (e) {
    console.error("Insert failed:", e.message);
  }
  await client.end();
}
testInsert();
