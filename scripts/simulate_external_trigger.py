import requests
import time
import sys

def main():
    print("=== SIMULATING EXTERNAL EVENT TRIGGER (e.g. Email Received or File Dropped) ===")
    print("==========================================================================")
    
    # 1. Ask for a custom invoice body or use a premium custom test payload
    print("\n[Step 1] Preparing simulated billing document payload...")
    
    default_payload = """
    INCOMING TRANSACTION ALERTVIA STRIPE:
    Invoice Number: STRIPE-90812
    Customer Email: dinesh.k@enterprise.com
    Amount Charged: $5,490.00
    Authorized Date: May 17, 2026
    Notes: Standard SaaS Annual Enterprise License Subscription.
    """
    
    print("Custom Invoice document payload ready to dispatch:")
    print("--------------------------------------------------")
    print(default_payload.strip())
    print("--------------------------------------------------")

    # 2. Login to local FlowForge instance to secure API access
    print("\n[Step 2] Authenticating with FlowForge core router...")
    login_url = "http://localhost/api/v1/auth/login"
    try:
        login_res = requests.post(login_url, data={
            "username": "dineshreddykondur@gmail.com",
            "password": "dinesh27"
        })
        if login_res.status_code != 200:
            # Try alternate password
            login_res = requests.post(login_url, data={
                "username": "dineshreddykondur@gmail.com",
                "password": "Dinesh@0727"
            })
            
        if login_res.status_code != 200:
            print("[ERROR] Authentication failed! Please verify admin credentials inside database.")
            return
            
        token = login_res.json()["access_token"]
        print("[SUCCESS] Secure JWT Access Token generated successfully!")
    except Exception as e:
        print(f"[ERROR] Failed to reach backend API. Is Docker running? Error: {e}")
        return

    # 3. Dispatch the dynamic payload directly to the Webhook run endpoint!
    print("\n[Step 3] Dispatching event payload directly to webhook trigger URL...")
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Trigger workflow ID 15 (seeded workflow)
    workflow_id = 15
    run_url = f"http://localhost/api/v1/workflows/{workflow_id}/run"
    
    try:
        run_res = requests.post(run_url, headers=headers, json={
            "content": default_payload.strip()
        })
        if run_res.status_code != 202:
            print(f"[ERROR] Trigger failed with status code {run_res.status_code}: {run_res.text}")
            return
            
        exec_data = run_res.json()
        exec_id = exec_data["execution_id"]
        print(f"[SUCCESS] Webhook event successfully intercepted by FlowForge (Execution Log ID: {exec_id})")
        print("Task dispatched to RabbitMQ and processing inside background Celery workers...")
    except Exception as e:
        print(f"[ERROR] Webhook trigger failed: {e}")
        return

    # 4. Poll execution logs live to show real asynchronous processing!
    print("\n[Step 4] Polling Celery asynchronous execution status...")
    status_url = f"http://localhost/api/v1/executions/"
    
    completed = False
    attempts = 0
    while not completed and attempts < 15:
        attempts += 1
        time.sleep(1.5)
        
        try:
            res = requests.get(status_url, headers=headers)
            executions = res.json()
            # Find our execution log
            my_exec = next((e for e in executions if e["id"] == exec_id), None)
            
            if not my_exec:
                print("  Polling...")
                continue
                
            status = my_exec["status"]
            print(f"  [Attempt {attempts}] Current Async Worker State: {status}")
            
            if status == "COMPLETED":
                completed = True
                print("\n[SUCCESS] Background Celery Worker completed the workflow!")
                print("==================================================================")
                print("LIVE OUTPUT CHANNELS REGISTERED IN POSTGRESQL:")
                print("--------------------------------------------------")
                
                result_data = my_exec["result_data"]
                for idx, step_res in enumerate(result_data["steps"]):
                    print(f"\nSTEP {idx+1} ({step_res['action_type']}):")
                    print(step_res["output"].strip())
                    
                print("==================================================================")
                
            elif status == "FAILED":
                completed = True
                print(f"[ERROR] Celery worker processing failed: {my_exec['error_message']}")
        except Exception as e:
            print(f"  Polling error: {e}")

if __name__ == "__main__":
    main()
