import os
import json
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from pymongo import MongoClient

app = Flask(__name__, static_folder='.')
CORS(app)

# MongoDB connection settings
MONGO_URI = 'mongodb+srv://archemites:gpCjmcT8OHveuemd@hikareteku.bmo6ril.mongodb.net/?appName=hikareteku'
DB_NAME = 'hikaretekuteste'
COLLECTION_NAME = 'hikaretekuteste'

db_client = None
collection = None
use_local_fallback = False
LOCAL_DB_PATH = os.path.join(os.path.dirname(__file__), 'local_characters.json')

# Initialize local fallback file if it doesn't exist
if not os.path.exists(LOCAL_DB_PATH):
    with open(LOCAL_DB_PATH, 'w', encoding='utf-8') as f:
        json.dump([], f, indent=2)

def connect_db():
    global db_client, collection, use_local_fallback
    try:
        print('[INFO] Conectando ao banco de dados MongoDB Atlas (Python)...')
        db_client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=3000)
        # Force a connection check
        db_client.server_info()
        db = db_client[DB_NAME]
        collection = db[COLLECTION_NAME]
        print('[SUCCESS] Conexao com MongoDB Atlas estabelecida com sucesso!')
    except Exception as e:
        print('[WARNING] ==========================================================')
        print('[WARNING] ALERTA XENOTECH: Conexao com o MongoDB Atlas falhou.')
        print(f'[WARNING] Detalhes do erro: {str(e)}')
        print('[WARNING] Ativando PROTOCOLO DE CONTINGENCIA (Salvar Localmente).')
        print(f'[WARNING] Os personagens serao salvos no arquivo: local_characters.json')
        print('[WARNING] ==========================================================')
        use_local_fallback = True

# Helper functions for local fallback
def get_local_characters():
    try:
        with open(LOCAL_DB_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return []

def save_local_characters(chars):
    try:
        with open(LOCAL_DB_PATH, 'w', encoding='utf-8') as f:
            json.dump(chars, f, indent=2, default=str)
        return True
    except Exception as e:
        print('[ERROR] Erro ao escrever arquivo local:', e)
        return False

# ── API ROUTES ────────────────────────────────────────────────────────

# 1. POST /api/characters - Save or update a character sheet
@app.route('/api/characters', methods=['POST'])
def save_character():
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'Payload JSON invalido.'}), 400

        player_name = data.get('playerName')
        warrior_name = data.get('warriorName')

        if not player_name or not warrior_name:
            return jsonify({'error': 'Nome do jogador e do guerreiro sao obrigatorios.'}), 400

        p_name_norm = player_name.strip().upper()
        w_name_norm = warrior_name.strip().upper()

        payload = {
            'playerName': p_name_norm,
            'warriorName': w_name_norm,
            'pdl': data.get('pdl', ''),
            'kiType': data.get('kiType', 'normal'),
            'sheetData': data.get('sheetData', {}),
            'lastUpdated': datetime.utcnow().isoformat() + 'Z'
        }

        if use_local_fallback:
            chars = get_local_characters()
            idx = -1
            for i, c in enumerate(chars):
                if c.get('playerName') == p_name_norm and c.get('warriorName') == w_name_norm:
                    idx = i
                    break
            
            if idx != -1:
                chars[idx] = payload
            else:
                chars.append(payload)

            save_local_characters(chars)
            print(f'[SUCCESS] [LOCAL CONTINGENCY] Ficha [{w_name_norm}] do Jogador [{p_name_norm}] salva.')
            return jsonify({'success': True, 'fallback': True})
        else:
            query = {'playerName': p_name_norm, 'warriorName': w_name_norm}
            result = collection.update_one(query, {'$set': payload}, upsert=True)
            print(f'[SUCCESS] Ficha do Guerreiro [{w_name_norm}] do Jogador [{p_name_norm}] salva no Atlas.')
            return jsonify({'success': True, 'matched_count': result.matched_count, 'upserted_id': str(result.upserted_id)})

    except Exception as e:
        print('[ERROR] Erro ao salvar guerreiro:', e)
        return jsonify({'error': 'Internal server error while saving character.'}), 500

# 2. GET /api/characters/<playerName> - List all characters for a player
@app.route('/api/characters/<playerName>', methods=['GET'])
def list_characters(playerName):
    try:
        p_name_norm = playerName.strip().upper()
        print(f'[INFO] Requisitando guerreiros do jogador [{p_name_norm}]...')

        if use_local_fallback:
            chars = get_local_characters()
            filtered = []
            for c in chars:
                if c.get('playerName') == p_name_norm:
                    filtered.append({
                        'playerName': c.get('playerName'),
                        'warriorName': c.get('warriorName'),
                        'pdl': c.get('pdl'),
                        'kiType': c.get('kiType'),
                        'lastUpdated': c.get('lastUpdated')
                    })
            return jsonify(filtered)
        else:
            cursor = collection.find({'playerName': p_name_norm}, {
                'playerName': 1, 'warriorName': 1, 'pdl': 1, 'kiType': 1, 'lastUpdated': 1, '_id': 0
            })
            list_chars = list(cursor)
            return jsonify(list_chars)

    except Exception as e:
        print('[ERROR] Erro ao listar guerreiros:', e)
        return jsonify({'error': 'Internal server error while listing characters.'}), 500

# 2.5 GET /api/players/check/<playerName> - Check if a player name/nickname already exists
@app.route('/api/players/check/<playerName>', methods=['GET'])
def check_player_exists(playerName):
    try:
        p_name_norm = playerName.strip().upper()
        if use_local_fallback:
            chars = get_local_characters()
            exists = any(c.get('playerName') == p_name_norm for c in chars)
            return jsonify({'exists': exists})
        else:
            count = collection.count_documents({'playerName': p_name_norm})
            return jsonify({'exists': count > 0})
    except Exception as e:
        print('[ERROR] Erro ao verificar apelido:', e)
        return jsonify({'error': 'Internal server error'}), 500

# 3. GET /api/characters/<playerName>/<warriorName> - Load a specific character full data
@app.route('/api/characters/<playerName>/<warriorName>', methods=['GET'])
def load_character(playerName, warriorName):
    try:
        p_name_norm = playerName.strip().upper()
        w_name_norm = warriorName.strip().upper()
        print(f'[INFO] Carregando dados completos de [{w_name_norm}] de [{p_name_norm}]...')

        if use_local_fallback:
            chars = get_local_characters()
            for c in chars:
                if c.get('playerName') == p_name_norm and c.get('warriorName') == w_name_norm:
                    return jsonify(c)
            return jsonify({'error': 'Guerreiro nao encontrado.'}), 404
        else:
            char_data = collection.find_one({'playerName': p_name_norm, 'warriorName': w_name_norm}, {'_id': 0})
            if not char_data:
                return jsonify({'error': 'Guerreiro nao encontrado.'}), 404
            return jsonify(char_data)

    except Exception as e:
        print('[ERROR] Erro ao carregar guerreiro:', e)
        return jsonify({'error': 'Internal server error while loading character.'}), 500

# ── STATIC FILE SERVING ────────────────────────────────────────────────

@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/Charactersheet/')
@app.route('/Charactersheet')
def serve_charactersheet_index():
    return send_from_directory('Charactersheet', 'index.html')

@app.route('/Charactersheet/<path:path>')
def serve_charactersheet(path):
    return send_from_directory('Charactersheet', path)

@app.route('/Enemydice/')
@app.route('/Enemydice')
def serve_enemydice_index():
    return send_from_directory('Enemydice', 'index.html')

@app.route('/Enemydice/<path:path>')
def serve_enemydice(path):
    return send_from_directory('Enemydice', path)

@app.route('/<path:filename>')
def serve_static_files(filename):
    # Avoid serving source or config files
    if filename.endswith('.py') or filename.endswith('.txt') or filename.endswith('.md'):
         return "Acesso Negado", 403
    return send_from_directory('.', filename)

if __name__ == '__main__':
    connect_db()
    print('==========================================================')
    print('[INFO] Servidor Python Hikareteku rodando na porta 3000')
    print('[INFO] Acesse a interface local em: http://localhost:3000')
    if use_local_fallback:
        print('[WARNING] MODO DE CONTINGENCIA LOCAL ATIVO (local_characters.json)')
    else:
        print('[SUCCESS] CONECTADO DIRETAMENTE AO MONGODB ATLAS (NUVEM)')
    print('==========================================================')
    
    app.run(port=3000, host='0.0.0.0', debug=False)
