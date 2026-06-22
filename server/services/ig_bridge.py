import sys
import json
import base64
from instagrapi import Client

def main():
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Missing arguments"}))
        sys.exit(1)

    command = sys.argv[1]
    sessionid = sys.argv[2]

    try:
        cl = Client()
        cl.login_by_sessionid(sessionid)
    except Exception as e:
        print(json.dumps({"error": "Failed to login: " + str(e)}))
        sys.exit(1)

    try:
        if command == "getThreads":
            amount = int(sys.argv[3]) if len(sys.argv) > 3 else 50
            threads = cl.direct_threads(amount=amount)
            # Serialize
            out = []
            for t in threads:
                out.append({
                    "id": t.id,
                    "thread_title": t.thread_title,
                    "users": [{"username": u.username, "full_name": u.full_name, "pk": u.pk} for u in t.users] if t.users else []
                })
            print(json.dumps(out))

        elif command == "getGroupMessages":
            thread_id = sys.argv[3]
            amount = int(sys.argv[4]) if len(sys.argv) > 4 else 20
            messages = cl.direct_messages(thread_id, amount=amount)
            out = []
            for m in messages:
                out.append({
                    "item_id": m.id,
                    "timestamp": m.timestamp.timestamp() * 1000000 if hasattr(m.timestamp, 'timestamp') else 0,
                    "user_id": str(m.user_id),
                    "text": m.text
                })
            print(json.dumps(out))

        elif command == "sendDirectMessage":
            usernames = json.loads(sys.argv[3])
            text = sys.argv[4]
            user_ids = []
            for u in usernames:
                user_ids.append(cl.user_id_from_username(u))
            res = cl.direct_send(text, user_ids=user_ids)
            print(json.dumps({"success": True}))

        elif command == "sendDirectPhoto":
            usernames = json.loads(sys.argv[3])
            file_path = sys.argv[4]
            user_ids = []
            for u in usernames:
                user_ids.append(cl.user_id_from_username(u))
            res = cl.direct_send_photo(file_path, user_ids=user_ids)
            print(json.dumps({"success": True}))
        
        elif command == "verifySession":
            user_info = cl.user_info(cl.user_id)
            print(json.dumps({"success": True, "username": user_info.username}))

        else:
            print(json.dumps({"error": "Unknown command"}))
            sys.exit(1)

    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
