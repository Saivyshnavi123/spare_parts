import os
import psycopg2
import yaml
import uuid
import bcrypt
from flasgger import Swagger
from flask import Flask, request, jsonify
from flask_cors import CORS
from psycopg2.extras import RealDictCursor

app = Flask(__name__)

# --- CORS ---
CORS(app, support_credentials=True)

# --- Configuration ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'static/uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['SWAGGER'] = {'title': 'Auto Spare Parts API', 'uiversion': 3}

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Path handling for Render/Local
swagger_path = os.path.join(BASE_DIR, "swagger.yaml")
if not os.path.exists(swagger_path):
    swagger_path = os.path.join(BASE_DIR, "Backend", "swagger.yaml")

try:
    with open(swagger_path, "r") as f:
        template = yaml.safe_load(f)
    swagger = Swagger(app, template=template)
except Exception as e:
    print(f"Swagger Load Warning: {e}")
    swagger = Swagger(app)

# -----------------------------
# DB CONNECTION
# -----------------------------
def get_db_connection():
    return psycopg2.connect(
        dbname="spare_parts_vpja",
        user="spare_parts_vpja_user",
        password="PDbO9jg9BhA6wTJVguim0PwwSoHgl7C6",
        host="dpg-d77vcc7pm1nc73fk49ig-a.oregon-postgres.render.com",
        port="5432",
        sslmode='require'
    )

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# -----------------------------
# ROUTES
# -----------------------------

@app.route('/products', methods=['POST'])
def add_product():
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    try:
        admin_id = request.form.get('admin_id')
        cursor.execute("SELECT role FROM customers WHERE customer_id = %s", (admin_id,))
        admin = cursor.fetchone()
        if not admin or admin['role'] != 'admin':
            return jsonify({"message": "Admin access required"}), 403

        image_path = "/static/uploads/default.png"
        if 'file' in request.files:
            file = request.files['file']
            if file and allowed_file(file.filename):
                filename = f"{uuid.uuid4()}.{file.filename.rsplit('.', 1)[1].lower()}"
                file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
                image_path = f"/static/uploads/{filename}"

        cursor.execute("""
            INSERT INTO products (name, amount, description, stock_quantity, image_url)
            VALUES (%s, %s, %s, %s, %s) RETURNING product_id
        """, (request.form.get('name'), float(request.form.get('amount', 0)),
              request.form.get('description'), int(request.form.get('stock_quantity', 0)), image_path))
        conn.commit()
        return jsonify({'message': 'Product added', 'image_url': image_path}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/products', methods=['GET'])
def get_products():
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cursor.execute("SELECT * FROM products")
        return jsonify({'results': cursor.fetchall()}), 200
    finally:
        cursor.close()
        conn.close()

@app.route('/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cursor.execute("SELECT * FROM products WHERE product_id = %s", (product_id,))
        product = cursor.fetchone()
        return jsonify(product) if product else (jsonify({'message': 'Not found'}), 404)
    finally:
        cursor.close()
        conn.close()

@app.route('/login', methods=['POST'])
def login():
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    try:
        data = request.json
        cursor.execute("SELECT * FROM customers WHERE email = %s", (data.get('email'),))
        user = cursor.fetchone()
        if user and bcrypt.checkpw(data.get('password').encode('utf-8'), user['password'].encode('utf-8')):
            return jsonify({'message': 'Login successful', 'isValid': True, 'role': user['role'], 'customer_id': user['customer_id']}), 200
        return jsonify({'message': 'Invalid Credentials'}), 401
    finally:
        cursor.close()
        conn.close()

@app.route('/register', methods=['POST'])
def register():
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    try:
        data = request.json
        hashed_pw = bcrypt.hashpw(data.get('password').encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        cursor.execute("INSERT INTO customers (first_name, last_name, email, password, phone) VALUES (%s, %s, %s, %s, %s)",
                       (data.get('first_name'), data.get('last_name'), data.get('email'), hashed_pw, data.get('phone')))
        conn.commit()
        return jsonify({'message': 'Registered successfully'}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({'message': 'Error or Email exists'}), 400
    finally:
        cursor.close()
        conn.close()

@app.route('/customers/<int:customer_id>', methods=['GET'])
def get_customer(customer_id):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cursor.execute("SELECT * FROM customers WHERE customer_id = %s", (customer_id,))
        customer = cursor.fetchone()
        return jsonify(customer) if customer else (jsonify({'message': 'Not found'}), 404)
    finally:
        cursor.close()
        conn.close()

@app.route('/customers/<int:customer_id>', methods=['POST'])
def update_customer(customer_id):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    try:
        data = request.json
        cursor.execute("""
            UPDATE customers SET first_name=%s, last_name=%s, email=%s, phone=%s,
            address_line1=%s, address_line2=%s, city=%s, state=%s, zip_code=%s, country=%s
            WHERE customer_id=%s
        """, (data.get('first_name'), data.get('last_name'), data.get('email'), data.get('phone'),
              data.get('address_line1'), data.get('address_line2'), data.get('city'),
              data.get('state'), data.get('zip_code'), data.get('country'), customer_id))
        conn.commit()
        return jsonify({'message': 'Updated successfully'}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/orders', methods=['POST'])
def create_order():
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    try:
        data = request.json
        total = 0
        items_to_insert = []
        for item in data['items']:
            cursor.execute("SELECT amount FROM products WHERE product_id = %s", (item['product_id'],))
            p = cursor.fetchone()
            if p:
                sub = p['amount'] * item['quantity']
                total += sub
                items_to_insert.append((item['product_id'], item['quantity'], p['amount'], sub))

        cursor.execute("INSERT INTO orders (customer_id, total_amount, payment_method) VALUES (%s, %s, %s) RETURNING order_id",
                       (data['customer_id'], total, data['payment_method']))
        oid = cursor.fetchone()['order_id']
        for itm in items_to_insert:
            cursor.execute("INSERT INTO order_items (order_id, product_id, quantity, price, subtotal) VALUES (%s, %s, %s, %s, %s)",
                           (oid, *itm))
        conn.commit()
        return jsonify({'message': 'Order created', 'order_id': oid}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/orders/<int:order_id>/payment', methods=['POST'])
def process_payment(order_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        data = request.json
        cursor.execute("INSERT INTO payments (order_id, amount, payment_method) VALUES (%s, %s, %s)",
                       (order_id, data['amount'], data['payment_method']))
        cursor.execute("UPDATE orders SET status = 'Completed' WHERE order_id = %s", (order_id,))
        conn.commit()
        return jsonify({'message': 'Payment processed'}), 200
    finally:
        cursor.close()
        conn.close()

@app.route('/customers/<int:customer_id>/orders', methods=['GET'])
def get_customer_orders(customer_id):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cursor.execute("SELECT * FROM orders WHERE customer_id = %s", (customer_id,))
        orders = cursor.fetchall()
        for o in orders:
            cursor.execute("SELECT * FROM order_items WHERE order_id = %s", (o['order_id'],))
            o['items'] = cursor.fetchall()
        return jsonify({'results': orders})
    finally:
        cursor.close()
        conn.close()

@app.route('/customers', methods=['GET'])
def get_customers():
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cursor.execute("SELECT * FROM customers")
        return jsonify({'results': cursor.fetchall()})
    finally:
        cursor.close()
        conn.close()

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 10000))
    app.run(host='0.0.0.0', port=port)