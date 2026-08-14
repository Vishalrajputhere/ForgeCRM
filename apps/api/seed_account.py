"""
ForgeCRM — Account Data Seeding Script

Authenticates/Registers user `singhrajputvishal03@gmail.com` and populates their workspace
with enterprise CRM records: Companies, Contacts, Leads, Pipelines, Stages, Deals, Tasks,
AI Memories, and MCP Pending Actions.
"""

import asyncio
import uuid
from datetime import datetime, date, timedelta
from sqlalchemy import select
from app.core.config import get_settings
from app.db.engine import init_db, get_session_factory
from app.modules.identity.models import User, Role
from app.modules.workspace.models import Workspace, WorkspaceMember
from app.modules.crm.models import (
    Company, Contact, Lead, LeadSource, LeadStatus,
    Pipeline, PipelineStage, Deal, Task
)
from app.modules.ai.models import AIMemory, AIPendingAction, AIDocumentChunk
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def seed_user_account():
    settings = get_settings()
    init_db(settings.database_url_str)
    email = "singhrajputvishal03@gmail.com"
    raw_password = "123456789012"
    first_name = "Vishal"
    last_name = "Singh Rajput"

    session_factory = get_session_factory()
    async with session_factory() as db:
        print(f"[*] Starting account seeding for: {email}")

        # 1. Check or Create User
        stmt = select(User).where(User.email == email)
        res = await db.execute(stmt)
        user = res.scalar_one_or_none()

        if not user:
            user_id = uuid.uuid4()
            password_hash = pwd_context.hash(raw_password)
            user = User(
                id=user_id,
                email=email,
                first_name=first_name,
                last_name=last_name,
                password_hash=password_hash,
                is_active=True,
                is_email_verified=True,
            )
            db.add(user)
            await db.flush()
            print(f"[+] Created User: {user.email} (ID: {user.id})")
        else:
            print(f"[=] User already exists: {user.email} (ID: {user.id})")

        # 2. Check or Create Workspace
        stmt = select(Workspace).join(WorkspaceMember).where(WorkspaceMember.user_id == user.id)
        res = await db.execute(stmt)
        workspace = res.scalars().first()

        if not workspace:
            ws_id = uuid.uuid4()
            workspace = Workspace(
                id=ws_id,
                name=f"{first_name}'s Enterprise Workspace",
                slug=f"vishal-workspace-{uuid.uuid4().hex[:6]}",
                owner_id=user.id,
            )
            db.add(workspace)
            await db.flush()

            # Assign Owner Member Role
            stmt_role = select(Role).where(Role.name == "Super Admin")
            res_role = await db.execute(stmt_role)
            admin_role = res_role.scalar_one_or_none()
            if not admin_role:
                stmt_role = select(Role)
                res_role = await db.execute(stmt_role)
                admin_role = res_role.scalars().first()
            role_id = admin_role.id if admin_role else uuid.uuid4()

            member = WorkspaceMember(
                id=uuid.uuid4(),
                workspace_id=workspace.id,
                user_id=user.id,
                role_id=role_id,
                is_active=True,
            )
            db.add(member)
            await db.flush()
            print(f"[+] Created Workspace: {workspace.name} (ID: {workspace.id})")
        else:
            stmt_mem = select(WorkspaceMember).where(
                (WorkspaceMember.workspace_id == workspace.id) & (WorkspaceMember.user_id == user.id)
            )
            res_mem = await db.execute(stmt_mem)
            member = res_mem.scalars().first()
            print(f"[=] Found Workspace: {workspace.name} (ID: {workspace.id})")

        # 3. Create Lead Sources & Lead Statuses if missing
        stmt_sources = select(LeadSource).where(LeadSource.workspace_id == workspace.id)
        res_sources = await db.execute(stmt_sources)
        sources = res_sources.scalars().all()
        if not sources:
            source_names = ["Website Contact Form", "Inbound Demo Request", "LinkedIn Campaign", "Cold Outreach", "Partner Referral"]
            sources = []
            for sname in source_names:
                ls = LeadSource(id=uuid.uuid4(), workspace_id=workspace.id, name=sname, is_active=True)
                db.add(ls)
                sources.append(ls)
            await db.flush()

        stmt_statuses = select(LeadStatus).where(LeadStatus.workspace_id == workspace.id)
        res_statuses = await db.execute(stmt_statuses)
        statuses = res_statuses.scalars().all()
        if not statuses:
            status_data = [
                ("New Lead", "#3B82F6", 1, False),
                ("Contacted", "#8B5CF6", 2, False),
                ("Qualified (ICP Fit)", "#10B981", 3, False),
                ("Unqualified", "#EF4444", 4, True),
            ]
            statuses = []
            for sname, scolor, sorder, sfinal in status_data:
                lst = LeadStatus(id=uuid.uuid4(), workspace_id=workspace.id, name=sname, color=scolor, sort_order=sorder, is_final=sfinal)
                db.add(lst)
                statuses.append(lst)
            await db.flush()

        # 4. Create Pipeline & Pipeline Stages if missing
        stmt_pipe = select(Pipeline).where(Pipeline.workspace_id == workspace.id)
        res_pipe = await db.execute(stmt_pipe)
        pipeline = res_pipe.scalar_one_or_none()

        if not pipeline:
            pipeline = Pipeline(
                id=uuid.uuid4(),
                workspace_id=workspace.id,
                name="Enterprise Sales Pipeline",
                description="Standard Q3/Q4 Enterprise B2B SaaS Pipeline",
                is_default=True,
                is_active=True,
            )
            db.add(pipeline)
            await db.flush()

            stage_data = [
                ("Discovery & Need Analysis", 1, 20, False, False, "#3B82F6"),
                ("Solution Demo & Proposal", 2, 40, False, False, "#8B5CF6"),
                ("Security Review & Procurement", 3, 70, False, False, "#F59E0B"),
                ("Contract Negotiation", 4, 90, False, False, "#10B981"),
                ("Closed Won", 5, 100, True, True, "#059669"),
                ("Closed Lost", 6, 0, True, False, "#DC2626"),
            ]
            stages = []
            for st_name, st_order, st_prob, st_closed, st_won, st_color in stage_data:
                pst = PipelineStage(
                    id=uuid.uuid4(),
                    pipeline_id=pipeline.id,
                    name=st_name,
                    sort_order=st_order,
                    probability=st_prob,
                    is_closed=st_closed,
                    is_won=st_won,
                    color=st_color,
                )
                db.add(pst)
                stages.append(pst)
            await db.flush()
        else:
            stmt_stages = select(PipelineStage).where(PipelineStage.pipeline_id == pipeline.id).order_by(PipelineStage.sort_order)
            res_stages = await db.execute(stmt_stages)
            stages = res_stages.scalars().all()

        # 5. Seed Companies
        companies_data = [
            ("Acme Holding Corp", "Acme International Ltd", "https://acmeholding.com", "contact@acmeholding.com", "+1 800 555 0199", 14500000.0, 450, "Global enterprise manufacturing conglomerate"),
            ("Apex Solutions Inc", "Apex Solutions LLC", "https://apexsolutions.io", "sales@apexsolutions.io", "+1 800 555 0244", 8900000.0, 180, "Fintech & cloud infrastructure service provider"),
            ("CloudScale Systems", "CloudScale Technologies", "https://cloudscale.net", "info@cloudscale.net", "+1 800 555 0388", 22000000.0, 720, "High-scale Kubernetes automation and DevOps tooling"),
            ("Cyberdyne Logistics", "Cyberdyne Global Logistics", "https://cyberdyneglobal.com", "ops@cyberdyneglobal.com", "+1 800 555 0411", 5200000.0, 120, "Supply chain optimization and warehouse robotics"),
            ("Nexus BioPharma", "Nexus Life Sciences Inc", "https://nexusbio.com", "research@nexusbio.com", "+1 800 555 0566", 35000000.0, 1200, "Enterprise pharmaceutical clinical trials platform"),
        ]

        seeded_companies = []
        for cname, legal, web, cemail, cphone, rev, emp, desc in companies_data:
            stmt_c = select(Company).where((Company.workspace_id == workspace.id) & (Company.name == cname))
            res_c = await db.execute(stmt_c)
            comp = res_c.scalar_one_or_none()
            if not comp:
                comp = Company(
                    id=uuid.uuid4(),
                    workspace_id=workspace.id,
                    owner_member_id=member.id,
                    name=cname,
                    legal_name=legal,
                    website=web,
                    email=cemail,
                    phone=cphone,
                    annual_revenue=rev,
                    employee_count=emp,
                    description=desc,
                    status="Active",
                )
                db.add(comp)
                await db.flush()
                print(f"[+] Seeded Company: {comp.name}")
            seeded_companies.append(comp)

        # 6. Seed Contacts
        contacts_data = [
            (seeded_companies[0].id, "Sarah", "Connor", "VP of Procurement", "Procurement", "sarah.connor@acmeholding.com", "+1 800 555 0191", True),
            (seeded_companies[0].id, "David", "Miller", "Director of IT Security", "Engineering", "david.miller@acmeholding.com", "+1 800 555 0192", False),
            (seeded_companies[1].id, "Marcus", "Vance", "Chief Technology Officer", "Executive", "marcus.vance@apexsolutions.io", "+1 800 555 0241", True),
            (seeded_companies[2].id, "Emily", "Watson", "Head of Cloud Infrastructure", "DevOps", "emily.watson@cloudscale.net", "+1 800 555 0381", True),
            (seeded_companies[3].id, "Robert", "Chen", "VP of Logistics", "Operations", "robert.chen@cyberdyneglobal.com", "+1 800 555 0412", True),
        ]

        seeded_contacts = []
        for cid, fname, lname, jtitle, dept, cemail, cphone, is_prim in contacts_data:
            stmt_cnt = select(Contact).where((Contact.workspace_id == workspace.id) & (Contact.email == cemail))
            res_cnt = await db.execute(stmt_cnt)
            cnt = res_cnt.scalar_one_or_none()
            if not cnt:
                cnt = Contact(
                    id=uuid.uuid4(),
                    workspace_id=workspace.id,
                    company_id=cid,
                    owner_member_id=member.id,
                    first_name=fname,
                    last_name=lname,
                    job_title=jtitle,
                    department=dept,
                    email=cemail,
                    phone=cphone,
                    is_primary=is_prim,
                    status="Active",
                )
                db.add(cnt)
                await db.flush()
                print(f"[+] Seeded Contact: {cnt.first_name} {cnt.last_name} ({jtitle})")
            seeded_contacts.append(cnt)

        # 7. Seed Leads
        leads_data = [
            ("Alexander", "Wright", "OmniCorp Security", "Chief Information Security Officer", "alex.wright@omnicorp.sec", 175000.0, "High", "Inbound request for SOC2 compliance report & AI firewall audit"),
            ("Jessica", "Taylor", "Hyperion Data", "VP of Sales Operations", "jessica.t@hyperiondata.com", 95000.0, "Medium", "Interested in AI Deal Coach and win probability prediction"),
            ("Michael", "Chang", "Quantum Dynamics", "Director of Business Development", "m.chang@quantumdyn.com", 210000.0, "High", "Requires custom API integrations and multi-tenant workspace isolation"),
        ]

        for fname, lname, cname, jtitle, lemail, val, prio, ldesc in leads_data:
            stmt_l = select(Lead).where((Lead.workspace_id == workspace.id) & (Lead.email == lemail))
            res_l = await db.execute(stmt_l)
            ld = res_l.scalar_one_or_none()
            if not ld:
                ld = Lead(
                    id=uuid.uuid4(),
                    workspace_id=workspace.id,
                    owner_member_id=member.id,
                    source_id=sources[0].id if sources else None,
                    status_id=statuses[0].id if statuses else None,
                    first_name=fname,
                    last_name=lname,
                    company_name=cname,
                    job_title=jtitle,
                    email=lemail,
                    estimated_value=val,
                    priority=prio,
                    description=ldesc,
                )
                db.add(ld)
                await db.flush()
                print(f"[+] Seeded Lead: {ld.first_name} {ld.last_name} ({ld.company_name})")

        # 8. Seed Deals
        deals_data = [
            ("Acme Corp Enterprise License Renewal", 185000.0, seeded_companies[0].id, seeded_contacts[0].id, stages[3].id if len(stages) > 3 else stages[0].id),
            ("Apex Cloud Security Expansion", 95000.0, seeded_companies[1].id, seeded_contacts[2].id, stages[2].id if len(stages) > 2 else stages[0].id),
            ("CloudScale AI Copilot Rollout", 240000.0, seeded_companies[2].id, seeded_contacts[3].id, stages[1].id if len(stages) > 1 else stages[0].id),
            ("Cyberdyne Supply Chain Optimization", 130000.0, seeded_companies[3].id, seeded_contacts[4].id, stages[4].id if len(stages) > 4 else stages[0].id),
        ]

        for dname, dval, comp_id, cnt_id, stage_id in deals_data:
            stmt_d = select(Deal).where((Deal.workspace_id == workspace.id) & (Deal.name == dname))
            res_d = await db.execute(stmt_d)
            dl = res_d.scalar_one_or_none()
            if not dl:
                dl = Deal(
                    id=uuid.uuid4(),
                    workspace_id=workspace.id,
                    pipeline_id=pipeline.id,
                    stage_id=stage_id,
                    company_id=comp_id,
                    primary_contact_id=cnt_id,
                    owner_member_id=member.id,
                    name=dname,
                    value=dval,
                )
                db.add(dl)
                await db.flush()
                print(f"[+] Seeded Deal: {dl.name} (${dl.value:,.2f})")

        # 9. Seed Tasks
        tasks_data = [
            ("Schedule SOC2 Type II report review with Acme VP Sarah Connor", "High", "Pending", datetime.utcnow() + timedelta(days=2)),
            ("Send revised Q3 proposal pricing matrix to Apex CTO Marcus Vance", "Urgent", "Pending", datetime.utcnow() + timedelta(days=1)),
            ("Conduct technical architecture deep-dive with CloudScale DevOps team", "Medium", "In Progress", datetime.utcnow() + timedelta(days=4)),
        ]

        for ttitle, tprio, tstatus, tdue in tasks_data:
            stmt_t = select(Task).where((Task.workspace_id == workspace.id) & (Task.title == ttitle))
            res_t = await db.execute(stmt_t)
            tk = res_t.scalar_one_or_none()
            if not tk:
                tk = Task(
                    id=uuid.uuid4(),
                    workspace_id=workspace.id,
                    owner_member_id=member.id,
                    assigned_member_id=member.id,
                    title=ttitle,
                    priority=tprio,
                    status=tstatus,
                    due_date=tdue,
                )
                db.add(tk)
                await db.flush()
                print(f"[+] Seeded Task: {tk.title}")

        # 10. Seed AI Memory Rules
        memories_data = [
            ("acme_security_requirement", "Acme Corp requires SOC2 Type II report & SAML SSO sign-off before contract finalization.", "workspace", True, 0.98),
            ("preferred_discount_threshold", "VP of Sales preferred maximum discount threshold is 15% without CFO written sign-off.", "preference", True, 0.95),
            ("q3_enterprise_arr_target", "Q3 Enterprise ARR target is set to $2,400,000 across core sales teams.", "summary", False, 0.92),
        ]

        for mkey, mval, mtype, mpinned, mconf in memories_data:
            stmt_m = select(AIMemory).where((AIMemory.workspace_id == workspace.id) & (AIMemory.key == mkey))
            res_m = await db.execute(stmt_m)
            mem = res_m.scalar_one_or_none()
            if not mem:
                mem = AIMemory(
                    id=uuid.uuid4(),
                    workspace_id=workspace.id,
                    user_id=user.id,
                    key=mkey,
                    value=mval,
                    memory_type=mtype,
                    is_pinned=mpinned,
                    confidence=mconf,
                )
                db.add(mem)
                await db.flush()
                print(f"[+] Seeded AI Memory: {mem.key}")

        # 11. Seed MCP Pending Action
        stmt_p = select(AIPendingAction).where((AIPendingAction.workspace_id == workspace.id) & (AIPendingAction.status == "pending"))
        res_p = await db.execute(stmt_p)
        pending_act = res_p.scalar_one_or_none()
        if not pending_act:
            pending_act = AIPendingAction(
                id=uuid.uuid4(),
                workspace_id=workspace.id,
                user_id=user.id,
                tool_name="delete_company",
                arguments_json={"company_id": str(seeded_companies[0].id), "name": "Acme Holding Corp", "reason": "Duplicate account cleanup request"},
                description="AI Agent requested Tier 3 destructive company deletion for Acme Holding Corp",
                status="pending",
            )
            db.add(pending_act)
            await db.flush()
            print(f"[+] Seeded MCP Pending Action: {pending_act.tool_name}")

        await db.commit()
        print("\n=======================================================")
        print(f"SUCCESS: Account '{email}' seeded with real CRM dataset!")
        print(f"User ID: {user.id}")
        print(f"Workspace ID: {workspace.id}")
        print("=======================================================")

if __name__ == "__main__":
    asyncio.run(seed_user_account())
