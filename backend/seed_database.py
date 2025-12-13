"""
Script to seed the database with job postings, users, and applications.
Deletes all existing data and inserts new sample data with proper relationships.
"""
import asyncio
from datetime import datetime, timedelta

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient

from core.config import settings


async def seed_database():
    """Seed entire database with jobs, users, applications, and assignments."""
    # Connect to MongoDB
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DB_NAME]
    
    jobs_collection = db["jobs"]
    users_collection = db["users"]
    applications_collection = db["applications"]
    assignments_collection = db["assignments"]
    
    # ============================================================
    # 1. DELETE ALL EXISTING DATA
    # ============================================================
    print("\n" + "="*60)
    print("STEP 1: Cleaning up existing data...")
    print("="*60)
    
    # Delete in order to respect relationships
    # First delete assignments (depend on applications)
    assignments_deleted = await assignments_collection.delete_many({})
    print(f"✓ Deleted {assignments_deleted.deleted_count} assignments")
    
    # Then delete applications (depend on jobs and users)
    apps_deleted = await applications_collection.delete_many({})
    print(f"✓ Deleted {apps_deleted.deleted_count} applications")
    
    # Finally delete jobs and users
    jobs_deleted = await jobs_collection.delete_many({})
    print(f"✓ Deleted {jobs_deleted.deleted_count} jobs")
    
    users_deleted = await users_collection.delete_many({})
    print(f"✓ Deleted {users_deleted.deleted_count} users")
    
    # ============================================================
    # 2. CREATE JOBS (5 ACTIVE JOBS)
    # ============================================================
    print("\n" + "="*60)
    print("STEP 2: Creating job postings...")
    print("="*60)
    
    jobs_data = [
        {
            "title": "Junior Python Backend Developer",
            "location": "Belgrade, Serbia",
            "location_type": "hybrid",
            "job_type": "full-time",
            "experience_level": "junior",
            "description": "We are looking for a motivated Junior Python Backend Developer to join our engineering team and grow your career in backend development. In this role, you will work on building and maintaining backend services under the guidance of senior engineers. You'll learn modern development practices, work with FastAPI and PostgreSQL, and contribute to real features used by thousands of users. Our team values mentorship, continuous learning, and collaborative problem-solving. This is an excellent opportunity for someone early in their career who wants to develop strong Python skills and gain hands-on experience with production systems in a supportive environment.",
            "responsibilities": [
                "Implement API endpoints and backend features using FastAPI",
                "Write clean, maintainable Python code following team standards",
                "Participate in code reviews and learn from senior developers",
                "Fix bugs and assist with testing and debugging",
                "Collaborate with frontend engineers on API integration",
                "Contribute to technical documentation and team knowledge base"
            ],
            "requirements": [
                "1-2 years of Python development experience or strong CS fundamentals",
                "Basic knowledge of web frameworks (FastAPI, Django, or Flask)",
                "Understanding of HTTP, REST APIs, and JSON",
                "Familiarity with relational databases (PostgreSQL or MySQL)",
                "Proficiency with Git and version control workflows",
                "Eagerness to learn and improve coding skills"
            ],
            "nice_to_have": [
                "Experience with FastAPI or async Python programming",
                "Basic knowledge of Docker and containerization",
                "Understanding of unit testing and test-driven development",
                "Exposure to CI/CD pipelines and deployment processes",
                "Contributions to personal projects or open-source"
            ],
            "tech_stack": ["Python", "FastAPI", "PostgreSQL", "Docker", "Git"],
            "benefits": [
                "Mentorship program with senior engineers",
                "Hybrid work model (3 days office, 2 days remote)",
                "Private health insurance",
                "Learning budget for courses and technical books",
                "Modern office with collaborative spaces",
                "Career growth opportunities and clear advancement path"
            ],
            "salary_range": {"min": 25000, "max": 38000, "currency": "USD"},
            "company_website": "https://techcorp.example.com",
            "apply_url": "https://techcorp.example.com/careers/junior-python-backend",
            "status": "active",
            "applications_count": 0,
            "created_at": datetime.utcnow() - timedelta(days=15),
            "updated_at": datetime.utcnow() - timedelta(days=2)
        },
        {
            "title": "React Frontend Developer",
            "location": "Belgrade, Serbia",
            "location_type": "hybrid",
            "job_type": "full-time",
            "experience_level": "mid",
            "description": "Join our frontend team as a React Developer and help us build beautiful, performant user interfaces that delight our users. You'll work on a modern tech stack including React, TypeScript, and Next.js, creating responsive web applications used by thousands of users daily. We're looking for someone passionate about clean code, component design, and user experience. You'll collaborate closely with our design team to bring mockups to life and work alongside backend engineers to integrate APIs seamlessly. This role offers great opportunities for growth and learning in a supportive environment.",
            "responsibilities": [
                "Build reusable and responsive UI components with React and TypeScript",
                "Implement pixel-perfect designs from Figma mockups",
                "Optimize application performance and improve Core Web Vitals",
                "Integrate RESTful APIs and manage application state effectively",
                "Write unit and integration tests for critical user flows",
                "Participate in sprint planning and daily stand-ups"
            ],
            "requirements": [
                "3+ years of experience with React and modern JavaScript",
                "Strong proficiency in TypeScript",
                "Experience with state management (Context API, Zustand, or Redux)",
                "Good understanding of HTML5, CSS3, and responsive design",
                "Familiarity with Git workflows and pull request reviews",
                "Strong communication skills and team player mindset"
            ],
            "nice_to_have": [
                "Experience with Next.js and server-side rendering",
                "Knowledge of Tailwind CSS or styled-components",
                "Understanding of web accessibility (WCAG) standards",
                "Experience with testing libraries (Jest, React Testing Library)",
                "Basic knowledge of CI/CD and frontend deployment"
            ],
            "tech_stack": ["React", "TypeScript", "Next.js", "Tailwind CSS", "Git"],
            "benefits": [
                "Hybrid work environment",
                "Private health insurance",
                "Annual learning budget of €1,500",
                "Flexible working hours",
                "Team building events and company retreats",
                "Modern MacBook Pro or laptop of your choice"
            ],
            "salary_range": {"min": 38000, "max": 54000, "currency": "USD"},
            "company_website": "https://webstudio.example.com",
            "apply_url": "https://webstudio.example.com/careers/react-developer",
            "status": "active",
            "applications_count": 0,
            "created_at": datetime.utcnow() - timedelta(days=20),
            "updated_at": datetime.utcnow() - timedelta(days=3)
        },
        {
            "title": "DevOps Engineer",
            "location": "Novi Sad, Serbia",
            "location_type": "hybrid",
            "job_type": "full-time",
            "experience_level": "mid",
            "description": "We're looking for a DevOps Engineer to help us build and maintain robust infrastructure and deployment pipelines. In this role, you'll be responsible for improving our CI/CD processes, managing cloud infrastructure on AWS, and ensuring high availability of our services. You'll work closely with development teams to streamline deployments and implement best practices for monitoring, logging, and incident response. We value automation, reliability, and proactive problem-solving. This is a great opportunity to work with modern DevOps tools and grow your expertise in cloud infrastructure and containerization.",
            "responsibilities": [
                "Design and maintain CI/CD pipelines using GitHub Actions or GitLab CI",
                "Manage and optimize AWS infrastructure (EC2, RDS, S3, CloudFormation)",
                "Implement monitoring, logging, and alerting solutions",
                "Automate deployment processes and infrastructure provisioning",
                "Ensure system security, backups, and disaster recovery procedures",
                "Collaborate with developers to improve deployment workflows"
            ],
            "requirements": [
                "3+ years of DevOps or system administration experience",
                "Strong knowledge of Docker and container orchestration",
                "Experience with AWS services and cloud architecture",
                "Proficiency in Linux system administration",
                "Experience with CI/CD tools (GitHub Actions, Jenkins, GitLab CI)",
                "Understanding of networking, security, and infrastructure as code"
            ],
            "nice_to_have": [
                "Experience with Kubernetes in production environments",
                "Knowledge of Terraform or other IaC tools",
                "Familiarity with monitoring tools (Prometheus, Grafana, Datadog)",
                "Experience with configuration management (Ansible, Chef)",
                "AWS certifications (Solutions Architect, DevOps Engineer)"
            ],
            "tech_stack": ["Docker", "AWS", "Terraform", "Kubernetes", "GitHub Actions", "Linux"],
            "benefits": [
                "Hybrid work (2-3 days in office)",
                "Competitive salary with annual reviews",
                "Private health and dental insurance",
                "Professional development budget",
                "Modern office with ergonomic workstations",
                "Sponsored AWS certifications and training"
            ],
            "salary_range": {"min": 50000, "max": 70000, "currency": "USD"},
            "company_website": "https://cloudtech.example.com",
            "apply_url": "https://cloudtech.example.com/jobs/devops-engineer",
            "status": "active",
            "applications_count": 0,
            "created_at": datetime.utcnow() - timedelta(days=12),
            "updated_at": datetime.utcnow() - timedelta(days=1)
        },
        {
            "title": "Full Stack Engineer (Node.js + React)",
            "location": "Remote",
            "location_type": "remote",
            "job_type": "full-time",
            "experience_level": "senior",
            "description": "We're seeking a talented Full Stack Engineer to join our fully remote team and take ownership of features from database to user interface. You'll work across the entire stack, building scalable backend APIs with Node.js and crafting intuitive frontends with React. This role is perfect for someone who loves variety, enjoys solving complex problems, and wants the autonomy to architect solutions end-to-end. You'll collaborate with product managers and designers to ship features that directly impact thousands of users. We're a remote-first company with a strong engineering culture focused on quality, testing, and continuous improvement.",
            "responsibilities": [
                "Design and develop full-stack features from API to UI",
                "Build RESTful APIs using Node.js, Express, and TypeScript",
                "Create responsive React components and manage application state",
                "Write comprehensive tests (unit, integration, and e2e)",
                "Review code and mentor team members",
                "Participate in architecture discussions and technical planning"
            ],
            "requirements": [
                "5+ years of full-stack development experience",
                "Strong proficiency in Node.js and React",
                "Solid TypeScript knowledge on both frontend and backend",
                "Experience with PostgreSQL or other relational databases",
                "Understanding of RESTful API design and microservices",
                "Excellent problem-solving and communication skills"
            ],
            "nice_to_have": [
                "Experience with Next.js or other SSR frameworks",
                "Knowledge of GraphQL and Apollo",
                "Familiarity with Docker and container orchestration",
                "Experience with test-driven development (TDD)",
                "Open-source contributions or technical blog posts"
            ],
            "tech_stack": ["Node.js", "React", "TypeScript", "PostgreSQL", "Docker", "AWS"],
            "benefits": [
                "100% remote work from anywhere",
                "Flexible working hours and async communication",
                "Competitive salary and equity options",
                "Home office budget (€2,000 one-time)",
                "Annual learning and conference budget",
                "4 weeks of paid vacation plus local holidays"
            ],
            "salary_range": {"min": 70000, "max": 100000, "currency": "USD"},
            "company_website": "https://remotestartup.example.com",
            "apply_url": "https://remotestartup.example.com/jobs/fullstack-engineer",
            "status": "active",
            "applications_count": 0,
            "created_at": datetime.utcnow() - timedelta(days=25),
            "updated_at": datetime.utcnow() - timedelta(days=5)
        },
        {
            "title": "QA Automation Engineer",
            "location": "Belgrade, Serbia",
            "location_type": "onsite",
            "job_type": "full-time",
            "experience_level": "mid",
            "description": "Join our quality assurance team as a QA Automation Engineer and help us ensure our product meets the highest standards. You'll be responsible for designing and implementing automated test suites, improving test coverage, and working closely with developers to catch bugs early. We're looking for someone detail-oriented with strong technical skills who can write reliable automated tests using modern tools like Playwright or Cypress. You'll have the opportunity to shape our testing strategy and contribute to building a culture of quality across the engineering team.",
            "responsibilities": [
                "Design and implement automated UI and API tests",
                "Build and maintain test automation framework",
                "Integrate tests into CI/CD pipelines for continuous testing",
                "Perform manual exploratory testing when needed",
                "Identify, document, and track bugs through resolution",
                "Collaborate with developers on testability and test coverage"
            ],
            "requirements": [
                "3+ years of experience in QA automation",
                "Strong knowledge of at least one automation framework (Playwright, Cypress, Selenium)",
                "Experience with JavaScript/TypeScript for test automation",
                "Understanding of API testing (REST, Postman, or similar tools)",
                "Familiarity with CI/CD concepts and test integration",
                "Strong analytical and debugging skills"
            ],
            "nice_to_have": [
                "Experience with performance or load testing",
                "Knowledge of Docker for test environment setup",
                "Familiarity with test management tools (TestRail, Zephyr)",
                "Understanding of security testing basics",
                "Experience with visual regression testing"
            ],
            "tech_stack": ["Playwright", "TypeScript", "Postman", "GitHub Actions", "Docker"],
            "benefits": [
                "Onsite work with collaborative team environment",
                "Private health insurance",
                "Professional training and certifications",
                "Modern office with free lunch and snacks",
                "Gym membership",
                "Regular team building activities"
            ],
            "salary_range": {"min": 32000, "max": 48000, "currency": "USD"},
            "company_website": "https://qualitylab.example.com",
            "apply_url": "https://qualitylab.example.com/careers/qa-automation",
            "status": "active",
            "applications_count": 0,
            "created_at": datetime.utcnow() - timedelta(days=18),
            "updated_at": datetime.utcnow() - timedelta(days=4)
        }
    ]
    
    # Insert jobs and store their IDs
    result = await jobs_collection.insert_many(jobs_data)
    job_ids = [str(id) for id in result.inserted_ids]
    
    print(f"✓ Created {len(job_ids)} job postings")
    for i, (job_id, job) in enumerate(zip(job_ids, jobs_data), 1):
        print(f"  {i}. {job['title']} (ID: {job_id})")
    
    # ============================================================
    # 3. CREATE USERS (5 CANDIDATES)
    # ============================================================
    print("\n" + "="*60)
    print("STEP 3: Creating candidate users...")
    print("="*60)
    
    users_data = [
        {
            "email": "marko.petrovic@gmail.com",
            "full_name": "Marko Petrović",
            "phone": "+381601234567",
            "location": "Belgrade, Serbia",
            "linkedin_url": "https://linkedin.com/in/markopetrovic",
            "github_url": "https://github.com/markopetrovic",
            "portfolio_url": "https://markopetrovic.dev",
            "resume_url": "https://storage.example.com/resumes/marko-petrovic.pdf",
            "bio": "Python developer with 2 years of experience building backend applications. Solid understanding of FastAPI and PostgreSQL. Completed several projects with REST APIs and eager to continue learning and growing professionally.",
            "applications_count": 0,
            "created_at": datetime.utcnow() - timedelta(days=40),
            "updated_at": datetime.utcnow() - timedelta(days=3)
        },
        {
            "email": "ana.jovanovic@gmail.com",
            "full_name": "Ana Jovanović",
            "phone": "+381607654321",
            "location": "Belgrade, Serbia",
            "linkedin_url": "https://linkedin.com/in/anajovanovic",
            "github_url": "https://github.com/anajovanovic",
            "bio": "Junior Python developer with 1 year of professional experience and strong CS fundamentals. Currently learning FastAPI and backend best practices. Motivated to work on real-world projects and develop technical skills.",
            "applications_count": 0,
            "created_at": datetime.utcnow() - timedelta(days=25),
            "updated_at": datetime.utcnow() - timedelta(days=2)
        },
        {
            "email": "stefan.nikolic@gmail.com",
            "full_name": "Stefan Nikolić",
            "phone": "+381603456789",
            "location": "Belgrade, Serbia",
            "linkedin_url": "https://linkedin.com/in/stefannikolic",
            "github_url": "https://github.com/stefannikolic",
            "portfolio_url": "https://stefannikolic.com",
            "resume_url": "https://storage.example.com/resumes/stefan-nikolic.pdf",
            "bio": "Frontend engineer with 4 years of React experience. Love building responsive UIs and working with modern tools like Next.js and TypeScript. Strong focus on user experience and performance.",
            "applications_count": 0,
            "created_at": datetime.utcnow() - timedelta(days=30),
            "updated_at": datetime.utcnow() - timedelta(days=1)
        },
        {
            "email": "jelena.markovic@gmail.com",
            "full_name": "Jelena Marković",
            "phone": "+381609876543",
            "location": "Novi Sad, Serbia",
            "linkedin_url": "https://linkedin.com/in/jelenamarkovic",
            "github_url": "https://github.com/jelenamarkovic",
            "resume_url": "https://storage.example.com/resumes/jelena-markovic.pdf",
            "bio": "DevOps engineer with 4 years of experience in AWS, Docker, and Kubernetes. Focused on automation, CI/CD, and infrastructure reliability. AWS Certified Solutions Architect.",
            "applications_count": 0,
            "created_at": datetime.utcnow() - timedelta(days=35),
            "updated_at": datetime.utcnow() - timedelta(days=4)
        },
        {
            "email": "nikola.djordjevic@gmail.com",
            "full_name": "Nikola Đorđević",
            "phone": "+381602345678",
            "location": "Belgrade, Serbia",
            "linkedin_url": "https://linkedin.com/in/nikoladjordjevic",
            "github_url": "https://github.com/nikoladjordjevic",
            "bio": "Full-stack developer with 5+ years of experience in Node.js and React. Comfortable working across the entire stack and passionate about building quality software.",
            "applications_count": 0,
            "created_at": datetime.utcnow() - timedelta(days=20),
            "updated_at": datetime.utcnow() - timedelta(days=1)
        }
    ]
    
    # Insert users and store their IDs
    result = await users_collection.insert_many(users_data)
    user_ids = [str(id) for id in result.inserted_ids]
    
    print(f"✓ Created {len(user_ids)} candidate users")
    for i, (user_id, user) in enumerate(zip(user_ids, users_data), 1):
        print(f"  {i}. {user['full_name']} ({user['email']})")
    
    # ============================================================
    # 4. CREATE APPLICATIONS (ALL PENDING STATUS)
    # ============================================================
    print("\n" + "="*60)
    print("STEP 4: Creating job applications...")
    print("="*60)
    
    # Application mapping:
    # Python job (job_ids[0]) - 2 candidates: Marko (more competent) and Ana
    # React job (job_ids[1]) - 1 candidate: Stefan
    # DevOps job (job_ids[2]) - 1 candidate: Jelena
    # Full Stack job (job_ids[3]) - 1 candidate: Nikola
    # QA job (job_ids[4]) - no applications
    
    applications_data = [
        # Python job - Marko (more experienced, 2 years)
        {
            "user_id": user_ids[0],  # Marko
            "job_id": job_ids[0],    # Python job
            "status": "pending",
            "applied_at": datetime.utcnow() - timedelta(days=3),
            "updated_at": datetime.utcnow() - timedelta(days=3),
            "additional_info": "I have 2 years of Python experience working with FastAPI and PostgreSQL. I've built several REST APIs and worked on database design. I'm eager to join a team where I can continue learning and contribute to production systems. Very excited about this opportunity!",
            "notes": None,
            "reviewed_at": None
        },
        # Python job - Ana (less experienced, 1 year)
        {
            "user_id": user_ids[1],  # Ana
            "job_id": job_ids[0],    # Python job
            "status": "pending",
            "applied_at": datetime.utcnow() - timedelta(days=2),
            "updated_at": datetime.utcnow() - timedelta(days=2),
            "additional_info": "I'm a junior Python developer with 1 year of professional experience and a strong educational background in CS. I've been learning FastAPI and modern backend practices. I'm looking for a team that values mentorship and continuous learning.",
            "notes": None,
            "reviewed_at": None
        },
        # React job - Stefan
        {
            "user_id": user_ids[2],  # Stefan
            "job_id": job_ids[1],    # React job
            "status": "pending",
            "applied_at": datetime.utcnow() - timedelta(days=1),
            "updated_at": datetime.utcnow() - timedelta(days=1),
            "additional_info": "Experienced React developer with strong TypeScript skills. I've built multiple production apps with Next.js and am passionate about creating performant, accessible UIs.",
            "notes": None,
            "reviewed_at": None
        },
        # DevOps job - Jelena
        {
            "user_id": user_ids[3],  # Jelena
            "job_id": job_ids[2],    # DevOps job
            "status": "pending",
            "applied_at": datetime.utcnow() - timedelta(days=4),
            "updated_at": datetime.utcnow() - timedelta(days=4),
            "additional_info": "AWS certified DevOps engineer with extensive experience in Docker, Kubernetes, and infrastructure automation. I love building reliable CI/CD pipelines and optimizing cloud costs.",
            "notes": None,
            "reviewed_at": None
        },
        # Full Stack job - Nikola
        {
            "user_id": user_ids[4],  # Nikola
            "job_id": job_ids[3],    # Full Stack job
            "status": "pending",
            "applied_at": datetime.utcnow() - timedelta(days=5),
            "updated_at": datetime.utcnow() - timedelta(days=5),
            "additional_info": "Full-stack engineer with 5+ years working with Node.js and React. I enjoy end-to-end feature ownership and have experience with both SQL and NoSQL databases. Remote work is a great fit for me.",
            "notes": None,
            "reviewed_at": None
        }
    ]
    
    # Insert applications
    if applications_data:
        result = await applications_collection.insert_many(applications_data)
        print(f"✓ Created {len(result.inserted_ids)} job applications (all pending)")
    
    # ============================================================
    # 5. UPDATE COUNTERS FROM DATABASE
    # ============================================================
    print("\n" + "="*60)
    print("STEP 5: Updating counters from database...")
    print("="*60)
    
    # Update applications_count for each job from database
    for job_id in job_ids:
        count = await applications_collection.count_documents({"job_id": job_id})
        await jobs_collection.update_one(
            {"_id": ObjectId(job_id)},
            {"$set": {"applications_count": count}}
        )
    
    # Update applications_count for each user from database
    for user_id in user_ids:
        count = await applications_collection.count_documents({"user_id": user_id})
        await users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"applications_count": count}}
        )
    
    print("✓ Updated applications_count for all jobs")
    print("✓ Updated applications_count for all users")
    
    # ============================================================
    # 6. PRINT SUMMARY
    # ============================================================
    print("\n" + "="*60)
    print("DATABASE SEEDING COMPLETED SUCCESSFULLY!")
    print("="*60)
    
    print("\n📊 JOBS SUMMARY:")
    jobs = await jobs_collection.find().sort("created_at", -1).to_list(length=100)
    for i, job in enumerate(jobs, 1):
        print(f"  {i}. {job['title']}")
        print(f"     • Status: {job['status']}")
        print(f"     • Applications: {job['applications_count']}")
        print(f"     • Experience Level: {job['experience_level']}")
        print(f"     • Location: {job['location']} ({job['location_type']})")
        print()
    
    print("👥 USERS SUMMARY:")
    users = await users_collection.find().to_list(length=100)
    print(f"  Total candidates: {len(users)}")
    for i, user in enumerate(users, 1):
        print(f"  {i}. {user['full_name']} ({user['email']}) - {user['applications_count']} application(s)")
    
    print(f"\n📝 APPLICATIONS SUMMARY:")
    print(f"  Total applications: {len(applications_data)}")
    print(f"  All applications are in PENDING status")
    print("\n  Distribution:")
    print(f"    • Junior Python Backend Developer: 2 applications")
    print(f"      - Marko Petrović (more experienced - 2 years)")
    print(f"      - Ana Jovanović (less experienced - 1 year)")
    print(f"    • React Frontend Developer: 1 application")
    print(f"    • DevOps Engineer: 1 application")
    print(f"    • Full Stack Engineer: 1 application")
    print(f"    • QA Automation Engineer: 0 applications")
    
    print("\n" + "="*60)
    print("✅ All data seeded successfully!")
    print("="*60)
    
    client.close()


if __name__ == "__main__":
    print("\n" + "🚀 " + "="*56 + " 🚀")
    print("    STARTING DATABASE SEEDING PROCESS")
    print("🚀 " + "="*56 + " 🚀")
    asyncio.run(seed_database())
