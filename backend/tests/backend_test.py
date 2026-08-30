"""Backend API tests for AI Portal (Node/Express + MongoDB)."""
import os
import io
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://smart-project-hub-9.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN = {"email": "mandeeps0564@gmail.com", "password": "Admin@123"}
TEAM = {"email": "sarah@agency.com", "password": "Team@123"}
CLIENT = {"email": "client@acme.com", "password": "Client@123"}


def login(creds):
    r = requests.post(f"{API}/auth/login", json=creds, timeout=30)
    assert r.status_code == 200, f"login failed {r.status_code} {r.text}"
    data = r.json()
    assert "token" in data and "user" in data
    return data["token"], data["user"]


def hdr(token):
    return {"Authorization": f"Bearer {token}"}


# ---- shared session tokens ----
@pytest.fixture(scope="session")
def admin_token():
    t, _ = login(ADMIN)
    return t


@pytest.fixture(scope="session")
def team_token():
    t, _ = login(TEAM)
    return t


@pytest.fixture(scope="session")
def client_token():
    t, u = login(CLIENT)
    return t, u


@pytest.fixture(scope="session")
def project_ctx(admin_token):
    rc = requests.get(f"{API}/clients", headers=hdr(admin_token))
    client_id = rc.json()[0]["_id"]
    r = requests.post(f"{API}/projects", headers=hdr(admin_token), json={
        "name": "TEST Project Fixture",
        "description": "fixture project",
        "clientId": client_id,
        "status": "active",
        "priority": "high",
        "budget": 5000,
    })
    assert r.status_code == 200, r.text
    pid = r.json()["_id"]
    yield {"projectId": pid, "clientId": client_id}
    requests.delete(f"{API}/projects/{pid}", headers=hdr(admin_token))


# ---- Health ----
def test_health():
    r = requests.get(f"{API}/health", timeout=15)
    assert r.status_code == 200
    assert r.json().get("status") == "ok"


# ---- Auth ----
class TestAuth:
    def test_admin_login(self):
        t, u = login(ADMIN)
        assert u["role"] == "admin"

    def test_team_login(self):
        t, u = login(TEAM)
        assert u["role"] == "team"

    def test_client_login(self):
        t, u = login(CLIENT)
        assert u["role"] == "client"
        assert u.get("clientId") is not None

    def test_login_invalid(self):
        r = requests.post(f"{API}/auth/login", json={"email": "bad@x.com", "password": "wrong"})
        assert r.status_code == 401

    def test_me(self, admin_token):
        r = requests.get(f"{API}/auth/me", headers=hdr(admin_token))
        assert r.status_code == 200
        assert r.json()["user"]["role"] == "admin"

    def test_register_new_client(self):
        email = f"TEST_reg_{int(time.time())}@example.com"
        r = requests.post(f"{API}/auth/register", json={
            "name": "TEST User", "email": email, "password": "Passw0rd!"
        })
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["user"]["role"] == "client"
        assert data["token"]
        # Login also works
        r2 = requests.post(f"{API}/auth/login", json={"email": email, "password": "Passw0rd!"})
        assert r2.status_code == 200


# ---- Dashboard ----
class TestDashboard:
    def test_admin_stats(self, admin_token):
        r = requests.get(f"{API}/dashboard/stats", headers=hdr(admin_token))
        assert r.status_code == 200
        d = r.json()
        for k in ["totalProjects", "tasksByStatus", "clientsCount", "revenue"]:
            assert k in d

    def test_client_stats_scoped(self, client_token):
        t, _ = client_token
        r = requests.get(f"{API}/dashboard/stats", headers=hdr(t))
        assert r.status_code == 200
        assert r.json()["clientsCount"] == 1


# ---- Projects ----
class TestProjects:
    def test_admin_list(self, admin_token):
        r = requests.get(f"{API}/projects", headers=hdr(admin_token))
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_team_list_scoped(self, team_token):
        r = requests.get(f"{API}/projects", headers=hdr(team_token))
        assert r.status_code == 200

    def test_client_list_scoped(self, client_token):
        t, u = client_token
        r = requests.get(f"{API}/projects", headers=hdr(t))
        assert r.status_code == 200
        projects = r.json()
        for p in projects:
            assert str(p["clientId"]["_id"] if isinstance(p["clientId"], dict) else p["clientId"]) == str(u["clientId"])

    def test_create_project_admin(self, admin_token):
        # Get a client id first
        rc = requests.get(f"{API}/clients", headers=hdr(admin_token))
        assert rc.status_code == 200
        clients = rc.json()
        assert len(clients) > 0
        client_id = clients[0]["_id"]

        r = requests.post(f"{API}/projects", headers=hdr(admin_token), json={
            "name": "TEST Project",
            "description": "test project",
            "clientId": client_id,
            "status": "active",
            "priority": "high",
            "budget": 10000,
        })
        assert r.status_code == 200, r.text
        pj = r.json()
        assert pj["name"] == "TEST Project"
        pytest.project_id = pj["_id"]

        # GET verify
        rg = requests.get(f"{API}/projects/{pj['_id']}", headers=hdr(admin_token))
        assert rg.status_code == 200
        assert rg.json()["name"] == "TEST Project"


# ---- Tasks / Kanban ----
class TestTasks:
    def test_create_and_move_task(self, admin_token):
        pid = getattr(pytest, "project_id", None)
        assert pid, "project not created"
        r = requests.post(f"{API}/tasks", headers=hdr(admin_token), json={
            "projectId": pid, "title": "TEST Task", "status": "todo", "priority": "medium"
        })
        assert r.status_code == 200, r.text
        task = r.json()
        tid = task["_id"]
        # move to in_progress
        r2 = requests.put(f"{API}/tasks/{tid}", headers=hdr(admin_token), json={"status": "in_progress"})
        assert r2.status_code == 200
        assert r2.json()["status"] == "in_progress"
        # move to done
        r3 = requests.put(f"{API}/tasks/{tid}", headers=hdr(admin_token), json={"status": "done"})
        assert r3.status_code == 200
        assert r3.json()["status"] == "done"
        pytest.task_id = tid

    def test_client_cannot_create_task(self, client_token):
        t, _ = client_token
        pid = getattr(pytest, "project_id", None)
        r = requests.post(f"{API}/tasks", headers=hdr(t), json={
            "projectId": pid, "title": "hack", "status": "todo"
        })
        assert r.status_code == 403


# ---- Role enforcement ----
class TestRoles:
    def test_client_cannot_create_client(self, client_token):
        t, _ = client_token
        r = requests.post(f"{API}/clients", headers=hdr(t), json={"name": "hack"})
        assert r.status_code == 403

    def test_client_cannot_create_team(self, client_token):
        t, _ = client_token
        r = requests.post(f"{API}/team", headers=hdr(t), json={
            "name": "x", "email": "x@x.com", "password": "y"
        })
        assert r.status_code == 403

    def test_unauth_project_list(self):
        r = requests.get(f"{API}/projects")
        assert r.status_code == 401


# ---- Clients CRUD ----
class TestClients:
    def test_create_client(self, admin_token):
        r = requests.post(f"{API}/clients", headers=hdr(admin_token), json={
            "name": "TEST Client Co", "company": "TEST Co", "email": "test@testco.com"
        })
        assert r.status_code == 200, r.text
        c = r.json()
        assert c["name"] == "TEST Client Co"
        pytest.client_created_id = c["_id"]

    def test_list_clients_has_projectCount(self, admin_token):
        r = requests.get(f"{API}/clients", headers=hdr(admin_token))
        assert r.status_code == 200
        for c in r.json():
            assert "projectCount" in c


# ---- Team ----
class TestTeam:
    def test_create_member(self, admin_token):
        email = f"TEST_team_{int(time.time())}@example.com"
        r = requests.post(f"{API}/team", headers=hdr(admin_token), json={
            "name": "TEST Member", "email": email, "password": "Passw0rd!", "role": "team", "title": "Dev"
        })
        assert r.status_code == 200, r.text
        assert r.json()["email"] == email.lower()
        pytest.team_created_id = r.json()["_id"]

    def test_delete_member(self, admin_token):
        tid = getattr(pytest, "team_created_id", None)
        if not tid:
            pytest.skip("no team member created")
        r = requests.delete(f"{API}/team/{tid}", headers=hdr(admin_token))
        assert r.status_code == 200


# ---- Invoices ----
class TestInvoices:
    def test_create_invoice_and_totals(self, admin_token, project_ctx):
        client_id = project_ctx["clientId"]
        pid = project_ctx["projectId"]
        r = requests.post(f"{API}/invoices", headers=hdr(admin_token), json={
            "clientId": client_id, "projectId": pid,
            "items": [{"description": "Dev", "quantity": 10, "rate": 100},
                      {"description": "Design", "quantity": 5, "rate": 80}],
            "taxRate": 10, "status": "draft"
        })
        assert r.status_code == 200, r.text
        inv = r.json()
        assert inv["subtotal"] == 1400
        assert inv["total"] == 1540
        assert inv["number"].startswith("INV-")
        pytest.invoice_id = inv["_id"]

    def test_status_flow_draft_sent_paid(self, admin_token):
        iid = pytest.invoice_id
        r = requests.put(f"{API}/invoices/{iid}/status", headers=hdr(admin_token), json={"status": "sent"})
        assert r.status_code == 200 and r.json()["status"] == "sent"
        r2 = requests.put(f"{API}/invoices/{iid}/status", headers=hdr(admin_token), json={"status": "paid"})
        assert r2.status_code == 200 and r2.json()["status"] == "paid"

    def test_client_sees_own_invoices(self, client_token):
        t, _ = client_token
        r = requests.get(f"{API}/invoices", headers=hdr(t))
        assert r.status_code == 200


# ---- Messages ----
class TestMessages:
    def test_send_and_get(self, admin_token, project_ctx):
        pid = project_ctx["projectId"]
        r = requests.post(f"{API}/messages", headers=hdr(admin_token), json={
            "projectId": pid, "body": "TEST hello"
        })
        assert r.status_code == 200, r.text
        assert r.json()["body"] == "TEST hello"
        r2 = requests.get(f"{API}/messages?projectId={pid}", headers=hdr(admin_token))
        assert r2.status_code == 200
        assert any(m["body"] == "TEST hello" for m in r2.json())


# ---- Files ----
class TestFiles:
    def test_upload_and_list(self, admin_token, project_ctx):
        pid = project_ctx["projectId"]
        files = {"file": ("test.txt", io.BytesIO(b"hello world"), "text/plain")}
        data = {"projectId": pid}
        r = requests.post(f"{API}/files/upload", headers=hdr(admin_token), files=files, data=data)
        assert r.status_code == 200, r.text
        fid = r.json()["_id"]
        r2 = requests.get(f"{API}/files?projectId={pid}", headers=hdr(admin_token))
        assert r2.status_code == 200
        assert any(f["_id"] == fid for f in r2.json())
        pytest.file_id = fid

    def test_download(self, admin_token):
        fid = pytest.file_id
        r = requests.get(f"{API}/files/{fid}/download?auth={admin_token}")
        assert r.status_code == 200
        assert r.content == b"hello world"


# ---- AI ----
class TestAI:
    def test_summarize(self, admin_token, project_ctx):
        pid = project_ctx["projectId"]
        r = requests.post(f"{API}/ai/summarize", headers=hdr(admin_token), json={"projectId": pid}, timeout=90)
        if r.status_code != 200:
            # retry once for overload
            time.sleep(2)
            r = requests.post(f"{API}/ai/summarize", headers=hdr(admin_token), json={"projectId": pid}, timeout=90)
        assert r.status_code == 200, r.text
        assert isinstance(r.json().get("text"), str)
        assert len(r.json()["text"]) > 20

    def test_generate_tasks(self, admin_token, project_ctx):
        pid = project_ctx["projectId"]
        r = requests.post(f"{API}/ai/generate-tasks", headers=hdr(admin_token),
                          json={"projectId": pid, "brief": "Build a landing page with contact form", "persist": True},
                          timeout=90)
        if r.status_code != 200:
            time.sleep(2)
            r = requests.post(f"{API}/ai/generate-tasks", headers=hdr(admin_token),
                              json={"projectId": pid, "brief": "Build a landing page", "persist": True},
                              timeout=90)
        assert r.status_code == 200, r.text
        data = r.json()
        assert isinstance(data.get("tasks"), list)
        assert len(data["tasks"]) > 0
        assert len(data.get("created", [])) == len(data["tasks"])

    def test_draft_email(self, admin_token, project_ctx):
        pid = project_ctx["projectId"]
        r = requests.post(f"{API}/ai/draft-email", headers=hdr(admin_token),
                          json={"projectId": pid, "purpose": "Kickoff email", "tone": "friendly"},
                          timeout=90)
        if r.status_code != 200:
            time.sleep(2)
            r = requests.post(f"{API}/ai/draft-email", headers=hdr(admin_token),
                              json={"projectId": pid, "purpose": "Kickoff email"},
                              timeout=90)
        assert r.status_code == 200, r.text
        assert "Subject" in r.json()["text"] or len(r.json()["text"]) > 30

    def test_ai_role_enforcement(self, client_token, project_ctx):
        t, _ = client_token
        r = requests.post(f"{API}/ai/generate-tasks", headers=hdr(t), json={"projectId": project_ctx["projectId"], "brief": "x"})
        assert r.status_code == 403


# ---- Cleanup ----
def test_zz_cleanup(admin_token):
    # delete task, project, client created
    tid = getattr(pytest, "task_id", None)
    if tid:
        requests.delete(f"{API}/tasks/{tid}", headers=hdr(admin_token))
    pid = getattr(pytest, "project_id", None)
    if pid:
        requests.delete(f"{API}/projects/{pid}", headers=hdr(admin_token))
    cid = getattr(pytest, "client_created_id", None)
    if cid:
        requests.delete(f"{API}/clients/{cid}", headers=hdr(admin_token))
    iid = getattr(pytest, "invoice_id", None)
    if iid:
        requests.delete(f"{API}/invoices/{iid}", headers=hdr(admin_token))
