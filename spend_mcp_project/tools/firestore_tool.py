import firebase_admin
from firebase_admin import credentials, firestore

if not firebase_admin._apps:
    cred = credentials.Certificate("credentials/service_account.json")
    firebase_admin.initialize_app(cred)

db = firestore.client()

def get_receipts(user_id):
    docs = db.collection("receipts").where("user_id", "==", user_id).stream()
    docs_list = list(docs)
    print(f"Found {(docs_list)} receipts for user {user_id}")
    return [doc.to_dict() for doc in docs_list]