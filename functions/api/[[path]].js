import { MongoClient } from 'mongodb';

let client = null;

async function getMongoClient(env) {
    if (!client) {
        const uri = env.MONGODB_URI;
        if (!uri) {
            throw new Error("MONGODB_URI environment variable is missing.");
        }
        client = new MongoClient(uri);
        await client.connect();
    }
    return client;
}

export async function onRequest(context) {
    const { request, env } = context;

    // Handle CORS Preflight requests
    if (request.method === "OPTIONS") {
        return new Response(null, {
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
                "Access-Control-Max-Age": "86400"
            }
        });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
    };

    try {
        const mongo = await getMongoClient(env);
        const db = mongo.db("hikaretekuteste");
        const collection = db.collection("hikaretekuteste");

        // 1. GET /api/players/check/:playerName
        if (path.startsWith("/api/players/check/")) {
            const playerName = decodeURIComponent(path.split("/").pop()).trim().toUpperCase();
            if (!playerName) {
                return new Response(JSON.stringify({ exists: false }), { headers: corsHeaders });
            }
            const count = await collection.countDocuments({ playerName });
            return new Response(JSON.stringify({ exists: count > 0 }), { headers: corsHeaders });
        }

        // 2. GET /api/characters/:playerName/:warriorName (Load full character)
        // Or GET /api/characters/:playerName (List all)
        if (path.startsWith("/api/characters/")) {
            const parts = path.replace("/api/characters/", "").split("/");
            
            if (parts.length === 2) {
                const playerName = decodeURIComponent(parts[0]).trim().toUpperCase();
                const warriorName = decodeURIComponent(parts[1]).trim().toUpperCase();
                const charData = await collection.findOne({ playerName, warriorName }, { projection: { _id: 0 } });
                if (!charData) {
                    return new Response(JSON.stringify({ error: "Guerreiro nao encontrado" }), { status: 404, headers: corsHeaders });
                }
                return new Response(JSON.stringify(charData), { headers: corsHeaders });
            } else if (parts.length === 1 && parts[0] !== "") {
                const playerName = decodeURIComponent(parts[0]).trim().toUpperCase();
                const chars = await collection.find({ playerName }, { projection: { playerName: 1, warriorName: 1, pdl: 1, kiType: 1, lastUpdated: 1, _id: 0 } }).toArray();
                return new Response(JSON.stringify(chars), { headers: corsHeaders });
            }
        }

        // 3. POST /api/characters (Save/Upsert character)
        if (path === "/api/characters" && request.method === "POST") {
            const data = await request.json();
            if (!data.playerName || !data.warriorName) {
                return new Response(JSON.stringify({ error: "Missing playerName or warriorName" }), { status: 400, headers: corsHeaders });
            }
            const playerName = data.playerName.trim().toUpperCase();
            const warriorName = data.warriorName.trim().toUpperCase();

            // Normalize data structure
            data.playerName = playerName;
            data.warriorName = warriorName;
            data.lastUpdated = new Date().toISOString();

            await collection.updateOne({ playerName, warriorName }, { $set: data }, { upsert: true });
            return new Response(JSON.stringify({ success: true, message: "Dados sincronizados no cofre com sucesso!" }), { headers: corsHeaders });
        }

        return new Response(JSON.stringify({ error: "Not Found" }), { status: 404, headers: corsHeaders });

    } catch (err) {
        console.error("Worker Error:", err);
        return new Response(JSON.stringify({ error: err.message || "Internal Server Error" }), { status: 500, headers: corsHeaders });
    }
}
