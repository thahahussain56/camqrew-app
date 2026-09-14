const { Client } = require('pg'); 
const client = new Client('postgresql://postgres.lwvmtjraqvniknstcvpk:Adgjmpu123%40%23@aws-0-ap-south-1.pooler.supabase.com:6543/postgres'); 
async function run() { 
  await client.connect(); 
  try { 
    await client.query(`ALTER TABLE products ADD COLUMN gtin VARCHAR, ADD COLUMN sku VARCHAR, ADD COLUMN bullet_points JSONB DEFAULT '[]', ADD COLUMN sale_price NUMERIC, ADD COLUMN item_dimensions VARCHAR, ADD COLUMN package_dimensions VARCHAR, ADD COLUMN item_weight VARCHAR, ADD COLUMN package_weight VARCHAR, ADD COLUMN search_terms JSONB DEFAULT '[]', ADD COLUMN browse_nodes JSONB DEFAULT '[]', ADD COLUMN battery_info VARCHAR, ADD COLUMN country_of_origin VARCHAR, ADD COLUMN safety_warnings VARCHAR;`); 
    console.log('products updated'); 
  } catch(e) { 
    console.log(e.message); 
  } 
  client.end(); 
} 
run();
