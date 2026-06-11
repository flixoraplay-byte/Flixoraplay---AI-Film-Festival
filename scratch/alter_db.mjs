import { createClient } from '@libsql/client/web';

const turso = createClient({
    url: "libsql://flixoraplay-db-adithya022.aws-ap-south-1.turso.io",
    authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3ODEwODcyOTYsImlkIjoiMDE5ZWIxMTItZTYwMS03MjYwLTg0NjgtNTkxODVlMjY2Y2MyIiwicmlkIjoiZDZhYmJjOWMtMjJhNS00YzQ2LWI5YzYtMDIwMTgyMjY0MmQzIn0.P6KsY3I9wFq5ZS2TwtFHOoaPV8TqytrTMmMl3YPg5TID_C0s66I-q_vlb9AQ181bMrXy4vuY8jf7cpsUvMk2AA"
});

async function main() {
    try {
        await turso.execute("ALTER TABLE competitions ADD COLUMN brand_kit_url TEXT;");
        console.log("Column added successfully");
    } catch (err) {
        if (err.message.includes("duplicate column")) {
            console.log("Column already exists");
        } else {
            console.error("Error:", err);
        }
    }
}
main();
