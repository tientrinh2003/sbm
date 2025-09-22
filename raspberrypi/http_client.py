import os, requests, json
URL = os.environ.get("WEB_URL","http://localhost:3000/api/measurements/webhook")
SECRET = os.environ.get("WEBHOOK_SECRET","dev-shared-webhook-secret")
data = {"userKey":"patient@smartbp.local","sys":128,"dia":83,"pulse":72,"telemetry":{"posture_ok":True,"mouth_open":False,"speak":False}}
r = requests.post(URL, headers={"Authorization":"Bearer "+SECRET}, json=data)
print("status", r.status_code, r.text)
