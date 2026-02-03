from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import random
import africastalking

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Settings
JWT_SECRET = os.environ.get('JWT_SECRET', 'foodnova-secret-key-change-in-production')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24 * 7  # 7 days

# Africa's Talking SMS Configuration
AT_USERNAME = os.environ.get('AT_USERNAME', 'sandbox')
AT_API_KEY = os.environ.get('AT_API_KEY', '')
SMS_ENABLED = bool(AT_API_KEY)

if SMS_ENABLED:
    africastalking.initialize(AT_USERNAME, AT_API_KEY)
    sms_service = africastalking.SMS

# Create the main app
app = FastAPI(title="FoodNova API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class UserBase(BaseModel):
    model_config = ConfigDict(extra="ignore")

class CustomerCreate(BaseModel):
    phone: str
    name: Optional[str] = None

class Customer(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    phone: str
    name: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AdminCreate(BaseModel):
    email: str
    password: str
    name: str

class Admin(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    password_hash: str
    name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AdminLogin(BaseModel):
    email: str
    password: str

class OTPRequest(BaseModel):
    phone: str

class OTPVerify(BaseModel):
    phone: str
    otp: str

class Category(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None
    image_url: Optional[str] = None

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category_id: str
    price: float
    unit: str  # kg, bag, litre, piece
    stock_quantity: int = 0
    low_stock_threshold: int = 10
    description: Optional[str] = None
    image_url: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProductCreate(BaseModel):
    name: str
    category_id: str
    price: float
    unit: str
    stock_quantity: int = 0
    low_stock_threshold: int = 10
    description: Optional[str] = None
    image_url: Optional[str] = None

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category_id: Optional[str] = None
    price: Optional[float] = None
    unit: Optional[str] = None
    stock_quantity: Optional[int] = None
    low_stock_threshold: Optional[int] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None

class DeliveryZone(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    fee: float
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DeliveryZoneCreate(BaseModel):
    name: str
    fee: float

class DeliveryZoneUpdate(BaseModel):
    name: Optional[str] = None
    fee: Optional[float] = None
    is_active: Optional[bool] = None

class CartItem(BaseModel):
    product_id: str
    product_name: str
    quantity: int
    price: float
    unit: str

class OrderCreate(BaseModel):
    customer_name: str
    customer_phone: str
    items: List[CartItem]
    fulfillment_type: str  # pickup or delivery
    pickup_time: Optional[str] = None  # For pickup orders
    delivery_zone_id: Optional[str] = None  # For delivery orders
    delivery_address: Optional[str] = None
    delivery_note: Optional[str] = None

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_number: str
    customer_id: Optional[str] = None
    customer_name: str
    customer_phone: str
    items: List[CartItem]
    subtotal: float
    delivery_fee: float = 0
    total: float
    fulfillment_type: str
    pickup_time: Optional[str] = None
    delivery_zone_id: Optional[str] = None
    delivery_zone_name: Optional[str] = None
    delivery_address: Optional[str] = None
    delivery_note: Optional[str] = None
    status: str = "pending_payment"
    payment_proof_url: Optional[str] = None
    logistics_name: Optional[str] = None
    logistics_phone: Optional[str] = None
    admin_notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OrderStatusUpdate(BaseModel):
    status: str
    logistics_name: Optional[str] = None
    logistics_phone: Optional[str] = None
    admin_notes: Optional[str] = None

class StockLog(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    product_id: str
    product_name: str
    quantity_change: int
    reason: str  # restock, sale, damage, adjustment
    admin_id: Optional[str] = None
    admin_name: Optional[str] = None
    order_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StockAdjustment(BaseModel):
    product_id: str
    quantity_change: int
    reason: str

class Settings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "main_settings"
    store_name: str = "FoodNova"
    bank_name: str = ""
    account_number: str = ""
    account_name: str = ""
    pickup_slots: List[str] = []
    sms_order_placed: str = "Your FoodNova order {order_id} has been placed. Total: ₦{total}. Please transfer to {bank_name} - {account_number} ({account_name}). Use {order_id} as narration."
    sms_payment_confirmed: str = "Your FoodNova order {order_id} payment has been confirmed. We're preparing your order."
    sms_ready_pickup: str = "Your FoodNova order {order_id} is ready for pickup at our store."
    sms_out_for_delivery: str = "Your FoodNova order {order_id} is out for delivery. Rider: {logistics_name} ({logistics_phone})"

class SettingsUpdate(BaseModel):
    store_name: Optional[str] = None
    bank_name: Optional[str] = None
    account_number: Optional[str] = None
    account_name: Optional[str] = None
    pickup_slots: Optional[List[str]] = None
    sms_order_placed: Optional[str] = None
    sms_payment_confirmed: Optional[str] = None
    sms_ready_pickup: Optional[str] = None
    sms_out_for_delivery: Optional[str] = None

# ==================== HELPER FUNCTIONS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: str, user_type: str) -> str:
    payload = {
        "user_id": user_id,
        "user_type": user_type,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return decode_token(credentials.credentials)

async def get_admin_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = await get_current_user(credentials)
    if user.get("user_type") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

def generate_order_number() -> str:
    timestamp = datetime.now(timezone.utc).strftime("%y%m%d")
    random_part = ''.join([str(random.randint(0, 9)) for _ in range(4)])
    return f"FN-{timestamp}-{random_part}"

def send_sms(phone: str, message: str):
    if not SMS_ENABLED:
        logger.info(f"SMS (Mock) to {phone}: {message}")
        return True
    try:
        # Ensure phone has country code
        if not phone.startswith('+'):
            phone = '+234' + phone.lstrip('0')
        response = sms_service.send(message, [phone])
        logger.info(f"SMS sent to {phone}: {response}")
        return True
    except Exception as e:
        logger.error(f"SMS failed to {phone}: {e}")
        return False

def serialize_doc(doc: dict) -> dict:
    """Convert MongoDB document for JSON response"""
    if '_id' in doc:
        del doc['_id']
    if 'timestamp' in doc and isinstance(doc['timestamp'], str):
        doc['timestamp'] = datetime.fromisoformat(doc['timestamp'])
    if 'created_at' in doc and isinstance(doc['created_at'], str):
        doc['created_at'] = datetime.fromisoformat(doc['created_at'])
    if 'updated_at' in doc and isinstance(doc['updated_at'], str):
        doc['updated_at'] = datetime.fromisoformat(doc['updated_at'])
    return doc

# ==================== AUTH ENDPOINTS ====================

@api_router.post("/auth/send-otp")
async def send_otp(request: OTPRequest):
    phone = request.phone
    otp = ''.join([str(random.randint(0, 9)) for _ in range(6)])
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
    
    # Store OTP
    await db.otps.update_one(
        {"phone": phone},
        {"$set": {"otp": otp, "expires_at": expires_at.isoformat(), "verified": False}},
        upsert=True
    )
    
    # Send SMS
    message = f"Your FoodNova verification code is: {otp}. Valid for 10 minutes."
    send_sms(phone, message)
    
    return {"message": "OTP sent successfully", "otp_for_testing": otp if not SMS_ENABLED else None}

@api_router.post("/auth/verify-otp")
async def verify_otp(request: OTPVerify):
    otp_doc = await db.otps.find_one({"phone": request.phone}, {"_id": 0})
    
    if not otp_doc:
        raise HTTPException(status_code=400, detail="No OTP found for this phone")
    
    if otp_doc['otp'] != request.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    expires_at = datetime.fromisoformat(otp_doc['expires_at'])
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=400, detail="OTP expired")
    
    # Mark as verified
    await db.otps.update_one({"phone": request.phone}, {"$set": {"verified": True}})
    
    # Find or create customer
    customer = await db.customers.find_one({"phone": request.phone}, {"_id": 0})
    if not customer:
        customer = Customer(phone=request.phone).model_dump()
        customer['created_at'] = customer['created_at'].isoformat()
        await db.customers.insert_one(customer)
    
    token = create_token(customer['id'], "customer")
    return {"token": token, "customer": serialize_doc(customer)}

@api_router.post("/auth/admin/login")
async def admin_login(request: AdminLogin):
    admin = await db.admins.find_one({"email": request.email}, {"_id": 0})
    
    if not admin or not verify_password(request.password, admin['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_token(admin['id'], "admin")
    admin_data = {k: v for k, v in admin.items() if k != 'password_hash'}
    return {"token": token, "admin": serialize_doc(admin_data)}

@api_router.get("/auth/me")
async def get_current_user_info(user: dict = Depends(get_current_user)):
    if user['user_type'] == 'customer':
        customer = await db.customers.find_one({"id": user['user_id']}, {"_id": 0})
        return {"user_type": "customer", "user": serialize_doc(customer) if customer else None}
    else:
        admin = await db.admins.find_one({"id": user['user_id']}, {"_id": 0})
        if admin:
            admin = {k: v for k, v in admin.items() if k != 'password_hash'}
        return {"user_type": "admin", "user": serialize_doc(admin) if admin else None}

@api_router.put("/auth/customer/profile")
async def update_customer_profile(name: str, user: dict = Depends(get_current_user)):
    if user['user_type'] != 'customer':
        raise HTTPException(status_code=403, detail="Customer access required")
    
    await db.customers.update_one(
        {"id": user['user_id']},
        {"$set": {"name": name}}
    )
    customer = await db.customers.find_one({"id": user['user_id']}, {"_id": 0})
    return serialize_doc(customer)

# ==================== CATEGORY ENDPOINTS ====================

@api_router.get("/categories", response_model=List[Category])
async def get_categories():
    categories = await db.categories.find({"is_active": True}, {"_id": 0}).to_list(100)
    return [serialize_doc(c) for c in categories]

@api_router.get("/admin/categories", response_model=List[Category])
async def admin_get_categories(user: dict = Depends(get_admin_user)):
    categories = await db.categories.find({}, {"_id": 0}).to_list(100)
    return [serialize_doc(c) for c in categories]

@api_router.post("/admin/categories", response_model=Category)
async def create_category(data: CategoryCreate, user: dict = Depends(get_admin_user)):
    category = Category(**data.model_dump())
    doc = category.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.categories.insert_one(doc)
    return category

@api_router.put("/admin/categories/{category_id}", response_model=Category)
async def update_category(category_id: str, data: CategoryCreate, user: dict = Depends(get_admin_user)):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    await db.categories.update_one({"id": category_id}, {"$set": update_data})
    category = await db.categories.find_one({"id": category_id}, {"_id": 0})
    return serialize_doc(category)

@api_router.delete("/admin/categories/{category_id}")
async def delete_category(category_id: str, user: dict = Depends(get_admin_user)):
    await db.categories.update_one({"id": category_id}, {"$set": {"is_active": False}})
    return {"message": "Category deleted"}

# ==================== PRODUCT ENDPOINTS ====================

@api_router.get("/products")
async def get_products(category_id: Optional[str] = None):
    query = {"is_active": True}
    if category_id:
        query["category_id"] = category_id
    products = await db.products.find(query, {"_id": 0}).to_list(500)
    return [serialize_doc(p) for p in products]

@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id, "is_active": True}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return serialize_doc(product)

@api_router.get("/admin/products")
async def admin_get_products(user: dict = Depends(get_admin_user)):
    products = await db.products.find({}, {"_id": 0}).to_list(500)
    return [serialize_doc(p) for p in products]

@api_router.post("/admin/products", response_model=Product)
async def create_product(data: ProductCreate, user: dict = Depends(get_admin_user)):
    product = Product(**data.model_dump())
    doc = product.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.products.insert_one(doc)
    
    # Log initial stock
    if data.stock_quantity > 0:
        stock_log = StockLog(
            product_id=product.id,
            product_name=product.name,
            quantity_change=data.stock_quantity,
            reason="restock",
            admin_id=user['user_id']
        )
        log_doc = stock_log.model_dump()
        log_doc['created_at'] = log_doc['created_at'].isoformat()
        await db.stock_logs.insert_one(log_doc)
    
    return product

@api_router.put("/admin/products/{product_id}", response_model=Product)
async def update_product(product_id: str, data: ProductUpdate, user: dict = Depends(get_admin_user)):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    await db.products.update_one({"id": product_id}, {"$set": update_data})
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    return serialize_doc(product)

@api_router.delete("/admin/products/{product_id}")
async def delete_product(product_id: str, user: dict = Depends(get_admin_user)):
    await db.products.update_one({"id": product_id}, {"$set": {"is_active": False}})
    return {"message": "Product deleted"}

# ==================== STOCK/INVENTORY ENDPOINTS ====================

@api_router.post("/admin/stock/adjust")
async def adjust_stock(data: StockAdjustment, user: dict = Depends(get_admin_user)):
    product = await db.products.find_one({"id": data.product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    new_quantity = product['stock_quantity'] + data.quantity_change
    if new_quantity < 0:
        raise HTTPException(status_code=400, detail="Stock cannot be negative")
    
    await db.products.update_one(
        {"id": data.product_id},
        {"$set": {"stock_quantity": new_quantity}}
    )
    
    # Get admin name
    admin = await db.admins.find_one({"id": user['user_id']}, {"_id": 0})
    admin_name = admin['name'] if admin else "Unknown"
    
    # Log stock change
    stock_log = StockLog(
        product_id=data.product_id,
        product_name=product['name'],
        quantity_change=data.quantity_change,
        reason=data.reason,
        admin_id=user['user_id'],
        admin_name=admin_name
    )
    log_doc = stock_log.model_dump()
    log_doc['created_at'] = log_doc['created_at'].isoformat()
    await db.stock_logs.insert_one(log_doc)
    
    return {"message": "Stock adjusted", "new_quantity": new_quantity}

@api_router.get("/admin/stock/logs")
async def get_stock_logs(product_id: Optional[str] = None, user: dict = Depends(get_admin_user)):
    query = {}
    if product_id:
        query["product_id"] = product_id
    logs = await db.stock_logs.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return [serialize_doc(l) for l in logs]

@api_router.get("/admin/stock/low")
async def get_low_stock_products(user: dict = Depends(get_admin_user)):
    products = await db.products.find(
        {"is_active": True, "$expr": {"$lte": ["$stock_quantity", "$low_stock_threshold"]}},
        {"_id": 0}
    ).to_list(100)
    return [serialize_doc(p) for p in products]

# ==================== DELIVERY ZONE ENDPOINTS ====================

@api_router.get("/delivery-zones")
async def get_delivery_zones():
    zones = await db.delivery_zones.find({"is_active": True}, {"_id": 0}).to_list(100)
    return [serialize_doc(z) for z in zones]

@api_router.get("/admin/delivery-zones")
async def admin_get_delivery_zones(user: dict = Depends(get_admin_user)):
    zones = await db.delivery_zones.find({}, {"_id": 0}).to_list(100)
    return [serialize_doc(z) for z in zones]

@api_router.post("/admin/delivery-zones", response_model=DeliveryZone)
async def create_delivery_zone(data: DeliveryZoneCreate, user: dict = Depends(get_admin_user)):
    zone = DeliveryZone(**data.model_dump())
    doc = zone.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.delivery_zones.insert_one(doc)
    return zone

@api_router.put("/admin/delivery-zones/{zone_id}", response_model=DeliveryZone)
async def update_delivery_zone(zone_id: str, data: DeliveryZoneUpdate, user: dict = Depends(get_admin_user)):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    await db.delivery_zones.update_one({"id": zone_id}, {"$set": update_data})
    zone = await db.delivery_zones.find_one({"id": zone_id}, {"_id": 0})
    return serialize_doc(zone)

@api_router.delete("/admin/delivery-zones/{zone_id}")
async def delete_delivery_zone(zone_id: str, user: dict = Depends(get_admin_user)):
    await db.delivery_zones.update_one({"id": zone_id}, {"$set": {"is_active": False}})
    return {"message": "Delivery zone deleted"}

# ==================== ORDER ENDPOINTS ====================

@api_router.post("/orders")
async def create_order(data: OrderCreate):
    # Validate stock availability
    for item in data.items:
        product = await db.products.find_one({"id": item.product_id}, {"_id": 0})
        if not product:
            raise HTTPException(status_code=400, detail=f"Product {item.product_id} not found")
        if product['stock_quantity'] < item.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for {product['name']}")
    
    # Calculate totals
    subtotal = sum(item.price * item.quantity for item in data.items)
    delivery_fee = 0
    delivery_zone_name = None
    
    if data.fulfillment_type == "delivery":
        if not data.delivery_zone_id:
            raise HTTPException(status_code=400, detail="Delivery zone required")
        zone = await db.delivery_zones.find_one({"id": data.delivery_zone_id}, {"_id": 0})
        if not zone:
            raise HTTPException(status_code=400, detail="Invalid delivery zone")
        delivery_fee = zone['fee']
        delivery_zone_name = zone['name']
    
    total = subtotal + delivery_fee
    
    # Find customer
    customer = await db.customers.find_one({"phone": data.customer_phone}, {"_id": 0})
    customer_id = customer['id'] if customer else None
    
    # Create order
    order = Order(
        order_number=generate_order_number(),
        customer_id=customer_id,
        customer_name=data.customer_name,
        customer_phone=data.customer_phone,
        items=[item.model_dump() for item in data.items],
        subtotal=subtotal,
        delivery_fee=delivery_fee,
        total=total,
        fulfillment_type=data.fulfillment_type,
        pickup_time=data.pickup_time,
        delivery_zone_id=data.delivery_zone_id,
        delivery_zone_name=delivery_zone_name,
        delivery_address=data.delivery_address,
        delivery_note=data.delivery_note,
        status="pending_payment"
    )
    
    doc = order.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    await db.orders.insert_one(doc)
    
    # Get settings for SMS
    settings = await db.settings.find_one({"id": "main_settings"}, {"_id": 0})
    if settings:
        message = settings.get('sms_order_placed', '').format(
            order_id=order.order_number,
            total=f"{total:,.2f}",
            bank_name=settings.get('bank_name', ''),
            account_number=settings.get('account_number', ''),
            account_name=settings.get('account_name', '')
        )
        send_sms(data.customer_phone, message)
    
    return {"order": serialize_doc(doc), "settings": settings}

@api_router.get("/orders/my")
async def get_my_orders(user: dict = Depends(get_current_user)):
    if user['user_type'] != 'customer':
        raise HTTPException(status_code=403, detail="Customer access required")
    
    customer = await db.customers.find_one({"id": user['user_id']}, {"_id": 0})
    if not customer:
        return []
    
    orders = await db.orders.find(
        {"customer_phone": customer['phone']},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return [serialize_doc(o) for o in orders]

@api_router.get("/orders/{order_number}")
async def get_order(order_number: str):
    order = await db.orders.find_one({"order_number": order_number}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return serialize_doc(order)

@api_router.get("/admin/orders")
async def admin_get_orders(status: Optional[str] = None, user: dict = Depends(get_admin_user)):
    query = {}
    if status:
        query["status"] = status
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return [serialize_doc(o) for o in orders]

@api_router.put("/admin/orders/{order_id}/status")
async def update_order_status(order_id: str, data: OrderStatusUpdate, user: dict = Depends(get_admin_user)):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    old_status = order['status']
    new_status = data.status
    
    update_data = {
        "status": new_status,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    if data.logistics_name:
        update_data["logistics_name"] = data.logistics_name
    if data.logistics_phone:
        update_data["logistics_phone"] = data.logistics_phone
    if data.admin_notes:
        update_data["admin_notes"] = data.admin_notes
    
    # Deduct stock when order is confirmed
    if old_status == "pending_payment" and new_status == "confirmed":
        admin = await db.admins.find_one({"id": user['user_id']}, {"_id": 0})
        admin_name = admin['name'] if admin else "Unknown"
        
        for item in order['items']:
            # Deduct stock
            await db.products.update_one(
                {"id": item['product_id']},
                {"$inc": {"stock_quantity": -item['quantity']}}
            )
            
            # Log stock change
            stock_log = StockLog(
                product_id=item['product_id'],
                product_name=item['product_name'],
                quantity_change=-item['quantity'],
                reason="sale",
                admin_id=user['user_id'],
                admin_name=admin_name,
                order_id=order_id
            )
            log_doc = stock_log.model_dump()
            log_doc['created_at'] = log_doc['created_at'].isoformat()
            await db.stock_logs.insert_one(log_doc)
    
    await db.orders.update_one({"id": order_id}, {"$set": update_data})
    
    # Send SMS notifications
    settings = await db.settings.find_one({"id": "main_settings"}, {"_id": 0})
    if settings:
        message = None
        if new_status == "confirmed":
            message = settings.get('sms_payment_confirmed', '').format(order_id=order['order_number'])
        elif new_status == "ready_for_pickup":
            message = settings.get('sms_ready_pickup', '').format(order_id=order['order_number'])
        elif new_status == "out_for_delivery":
            message = settings.get('sms_out_for_delivery', '').format(
                order_id=order['order_number'],
                logistics_name=data.logistics_name or "",
                logistics_phone=data.logistics_phone or ""
            )
        
        if message:
            send_sms(order['customer_phone'], message)
    
    updated_order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    return serialize_doc(updated_order)

@api_router.post("/admin/orders/{order_id}/payment-proof")
async def upload_payment_proof(order_id: str, payment_proof_url: str, user: dict = Depends(get_admin_user)):
    await db.orders.update_one(
        {"id": order_id},
        {"$set": {"payment_proof_url": payment_proof_url, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": "Payment proof uploaded"}

# ==================== SETTINGS ENDPOINTS ====================

@api_router.get("/settings")
async def get_public_settings():
    settings = await db.settings.find_one({"id": "main_settings"}, {"_id": 0})
    if not settings:
        return Settings().model_dump()
    return serialize_doc(settings)

@api_router.get("/admin/settings")
async def admin_get_settings(user: dict = Depends(get_admin_user)):
    settings = await db.settings.find_one({"id": "main_settings"}, {"_id": 0})
    if not settings:
        return Settings().model_dump()
    return serialize_doc(settings)

@api_router.put("/admin/settings")
async def update_settings(data: SettingsUpdate, user: dict = Depends(get_admin_user)):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    
    await db.settings.update_one(
        {"id": "main_settings"},
        {"$set": update_data},
        upsert=True
    )
    
    settings = await db.settings.find_one({"id": "main_settings"}, {"_id": 0})
    return serialize_doc(settings)

# ==================== DASHBOARD STATS ====================

@api_router.get("/admin/dashboard/stats")
async def get_dashboard_stats(user: dict = Depends(get_admin_user)):
    # Orders by status
    pending_payment = await db.orders.count_documents({"status": "pending_payment"})
    confirmed = await db.orders.count_documents({"status": "confirmed"})
    packing = await db.orders.count_documents({"status": "packing"})
    ready_pickup = await db.orders.count_documents({"status": "ready_for_pickup"})
    out_delivery = await db.orders.count_documents({"status": "out_for_delivery"})
    completed = await db.orders.count_documents({"status": {"$in": ["picked_up", "delivered", "completed"]}})
    
    # Low stock products
    low_stock = await db.products.count_documents({
        "is_active": True,
        "$expr": {"$lte": ["$stock_quantity", "$low_stock_threshold"]}
    })
    
    # Today's orders
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today_orders = await db.orders.count_documents({
        "created_at": {"$gte": today_start.isoformat()}
    })
    
    # Total revenue (completed orders)
    pipeline = [
        {"$match": {"status": {"$in": ["picked_up", "delivered", "completed"]}}},
        {"$group": {"_id": None, "total": {"$sum": "$total"}}}
    ]
    revenue_result = await db.orders.aggregate(pipeline).to_list(1)
    total_revenue = revenue_result[0]['total'] if revenue_result else 0
    
    return {
        "orders": {
            "pending_payment": pending_payment,
            "confirmed": confirmed,
            "packing": packing,
            "ready_for_pickup": ready_pickup,
            "out_for_delivery": out_delivery,
            "completed": completed
        },
        "low_stock_count": low_stock,
        "today_orders": today_orders,
        "total_revenue": total_revenue
    }

# ==================== SEED DATA ====================

@api_router.post("/seed")
async def seed_data():
    """Seed initial data for testing"""
    
    # Create default admin
    existing_admin = await db.admins.find_one({"email": "admin@foodnova.com"})
    if not existing_admin:
        admin = Admin(
            email="admin@foodnova.com",
            password_hash=hash_password("admin123"),
            name="FoodNova Admin"
        )
        doc = admin.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        await db.admins.insert_one(doc)
    
    # Create categories
    categories_data = [
        {"name": "Rice", "description": "Premium quality rice varieties", "image_url": "https://images.unsplash.com/photo-1586201375761-83865001e31c"},
        {"name": "Beans", "description": "Fresh and nutritious beans", "image_url": "https://images.unsplash.com/photo-1763368397625-32c8f75fed44"},
        {"name": "Oil", "description": "Cooking oils and vegetable oils", "image_url": "https://images.unsplash.com/photo-1757801333068-d52a3e448cde"},
        {"name": "Spices", "description": "Authentic Nigerian spices", "image_url": "https://images.unsplash.com/photo-1721934081798-34c4488fdd12"},
    ]
    
    for cat_data in categories_data:
        existing = await db.categories.find_one({"name": cat_data['name']})
        if not existing:
            cat = Category(**cat_data)
            doc = cat.model_dump()
            doc['created_at'] = doc['created_at'].isoformat()
            await db.categories.insert_one(doc)
    
    # Get category IDs
    categories = await db.categories.find({}, {"_id": 0}).to_list(10)
    cat_map = {c['name']: c['id'] for c in categories}
    
    # Create products
    products_data = [
        {"name": "Local Rice (50kg bag)", "category_id": cat_map.get('Rice'), "price": 75000, "unit": "bag", "stock_quantity": 50, "low_stock_threshold": 10},
        {"name": "Ofada Rice (5kg)", "category_id": cat_map.get('Rice'), "price": 8500, "unit": "kg", "stock_quantity": 100, "low_stock_threshold": 20},
        {"name": "Foreign Rice (50kg bag)", "category_id": cat_map.get('Rice'), "price": 85000, "unit": "bag", "stock_quantity": 30, "low_stock_threshold": 5},
        {"name": "Brown Beans (paint)", "category_id": cat_map.get('Beans'), "price": 4500, "unit": "paint", "stock_quantity": 80, "low_stock_threshold": 15},
        {"name": "Honey Beans (paint)", "category_id": cat_map.get('Beans'), "price": 5000, "unit": "paint", "stock_quantity": 60, "low_stock_threshold": 10},
        {"name": "Palm Oil (25L)", "category_id": cat_map.get('Oil'), "price": 35000, "unit": "litre", "stock_quantity": 40, "low_stock_threshold": 8},
        {"name": "Groundnut Oil (5L)", "category_id": cat_map.get('Oil'), "price": 12000, "unit": "litre", "stock_quantity": 70, "low_stock_threshold": 15},
        {"name": "Vegetable Oil (5L)", "category_id": cat_map.get('Oil'), "price": 10000, "unit": "litre", "stock_quantity": 90, "low_stock_threshold": 20},
        {"name": "Crayfish (1kg)", "category_id": cat_map.get('Spices'), "price": 8000, "unit": "kg", "stock_quantity": 45, "low_stock_threshold": 10},
        {"name": "Pepper Mix (500g)", "category_id": cat_map.get('Spices'), "price": 2500, "unit": "pack", "stock_quantity": 100, "low_stock_threshold": 25},
        {"name": "Ogiri (Local)", "category_id": cat_map.get('Spices'), "price": 1500, "unit": "pack", "stock_quantity": 60, "low_stock_threshold": 15},
        {"name": "Locust Beans (Iru)", "category_id": cat_map.get('Spices'), "price": 2000, "unit": "pack", "stock_quantity": 55, "low_stock_threshold": 12},
    ]
    
    for prod_data in products_data:
        if prod_data['category_id']:
            existing = await db.products.find_one({"name": prod_data['name']})
            if not existing:
                prod = Product(**prod_data)
                doc = prod.model_dump()
                doc['created_at'] = doc['created_at'].isoformat()
                await db.products.insert_one(doc)
    
    # Create delivery zones
    zones_data = [
        {"name": "Lagos Island", "fee": 1500},
        {"name": "Lagos Mainland", "fee": 2000},
        {"name": "Ikeja", "fee": 1800},
        {"name": "Lekki", "fee": 2500},
        {"name": "Victoria Island", "fee": 2000},
        {"name": "Surulere", "fee": 1500},
        {"name": "Yaba", "fee": 1200},
    ]
    
    for zone_data in zones_data:
        existing = await db.delivery_zones.find_one({"name": zone_data['name']})
        if not existing:
            zone = DeliveryZone(**zone_data)
            doc = zone.model_dump()
            doc['created_at'] = doc['created_at'].isoformat()
            await db.delivery_zones.insert_one(doc)
    
    # Create default settings
    existing_settings = await db.settings.find_one({"id": "main_settings"})
    if not existing_settings:
        settings = Settings(
            store_name="FoodNova",
            bank_name="First Bank",
            account_number="3012345678",
            account_name="FoodNova Enterprises",
            pickup_slots=[
                "9:00 AM - 10:00 AM",
                "10:00 AM - 11:00 AM",
                "11:00 AM - 12:00 PM",
                "12:00 PM - 1:00 PM",
                "2:00 PM - 3:00 PM",
                "3:00 PM - 4:00 PM",
                "4:00 PM - 5:00 PM"
            ]
        )
        await db.settings.insert_one(settings.model_dump())
    
    return {"message": "Data seeded successfully"}

# ==================== ROOT ENDPOINT ====================

@api_router.get("/")
async def root():
    return {"message": "FoodNova API", "version": "1.0.0"}

# Include router and middleware
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
