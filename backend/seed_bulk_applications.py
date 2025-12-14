"""
Bulk seed script to create 1000 applications for Junior Python Backend Developer job.
Creates applications from random generated users.
"""
import asyncio
from datetime import datetime, timedelta
import random
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient
from core.config import settings


# Sample data for generating realistic applications
FIRST_NAMES = [
    "Marko", "Ana", "Stefan", "Jelena", "Nikola", "Milica", "Petar", "Jovana",
    "Luka", "Sara", "Nemanja", "Teodora", "Filip", "Katarina", "Miloš", "Tijana",
    "Aleksandar", "Ivana", "Dušan", "Maja", "Vladimir", "Nevena", "Igor", "Dragana",
    "Uroš", "Sanja", "Bojan", "Marina", "Dejan", "Anđela", "Goran", "Kristina",
    "Zoran", "Danijela", "Srđan", "Vesna", "Milan", "Slavica", "Dragan", "Nataša"
]

LAST_NAMES = [
    "Petrović", "Jovanović", "Nikolić", "Marković", "Đorđević", "Ilić", "Pavlović",
    "Stanković", "Simić", "Tomić", "Popović", "Kostić", "Vuković", "Radovanović",
    "Milošević", "Stojanović", "Kovačević", "Dimitrijević", "Živković", "Stefanović",
    "Mitrović", "Mladenović", "Todorović", "Perić", "Lazić", "Đukić", "Stoiljković",
    "Aleksić", "Ristić", "Milić", "Savić", "Vasić", "Antić", "Lukić", "Filipović"
]

CITIES = [
    "Belgrade", "Novi Sad", "Niš", "Kragujevac", "Subotica", "Pančevo", "Čačak",
    "Kraljevo", "Novi Pazar", "Smederevo", "Leskovac", "Kruševac", "Valjevo",
    "Šabac", "Užice", "Sombor", "Kikinda", "Zrenjanin", "Vranje", "Jagodina"
]

STATUSES = ["pending", "reviewed", "invited", "rejected"]
STATUS_WEIGHTS = [0.50, 0.25, 0.15, 0.10]  # 50% pending, 25% invited, 15% rejected, 10% reviewed

BIO_TEMPLATES = [
    "Python developer with {} years of experience. Strong knowledge of backend development and REST APIs.",
    "Junior developer passionate about Python and web development. {} years working with modern frameworks.",
    "Backend engineer with {} years of Python experience. Built multiple production applications.",
    "Software developer specializing in Python and FastAPI. {} years of professional experience.",
    "Full-stack developer with focus on Python backend. {} years building scalable applications.",
    "Python programmer with {} years experience. Skilled in API development and database design.",
    "Backend developer passionate about clean code. {} years working with Python and PostgreSQL.",
    "Junior engineer with {} years Python experience. Eager to learn and grow in backend development.",
    "Software engineer with {} years building Python applications. Strong CS fundamentals.",
    "Python developer experienced in FastAPI and async programming. {} years professional experience."
]

ADDITIONAL_INFO_TEMPLATES = [
    "I have {} years of Python experience and I'm very interested in this position. I've worked with FastAPI, PostgreSQL, and Docker. Looking forward to contributing to your team!",
    "Python developer with {} years of experience. I've built several REST APIs and worked on database optimization. Excited about this opportunity to grow my skills!",
    "I'm a {} year Python developer passionate about backend development. I have experience with FastAPI, SQLAlchemy, and Redis. Would love to be part of your team.",
    "With {} years of Python development experience, I believe I'm a great fit for this role. I've worked on microservices and API design. Very excited to apply!",
    "Junior developer with {} years of Python experience. I've been learning FastAPI and modern backend practices. Eager to join a team that values mentorship.",
    "I have {} years of professional Python experience building web applications. Familiar with FastAPI, Django, and PostgreSQL. Looking for new challenges!",
    "Python engineer with {} years working on backend systems. I've built RESTful APIs, worked with databases, and deployed applications. Very interested in this position!",
    "I'm applying with {} years of Python development experience. Strong understanding of OOP, design patterns, and web frameworks. Excited about this opportunity!",
    "Backend developer with {} years of Python experience. I've worked on API development, database design, and testing. Would love to contribute to your projects!",
    "With {} years in Python development, I'm confident I can add value to your team. Experience with FastAPI, async programming, and PostgreSQL. Very motivated!"
]

NOTES_TEMPLATES = [
    "Strong technical background, good communication skills.",
    "Solid Python knowledge, needs more experience with async programming.",
    "Great portfolio, relevant projects.",
    "Good cultural fit, team player.",
    "Impressive problem-solving skills demonstrated in previous work.",
    "Strong educational background from top university.",
    "Excellent references from previous employers.",
    "Active open-source contributor, shows passion for coding.",
    "Quick learner, adapted well to new technologies in past roles.",
    "Great attention to detail in code samples provided."
]


def generate_email(first_name: str, last_name: str) -> str:
    """Generate realistic email address."""
    variations = [
        f"{first_name.lower()}.{last_name.lower()}@gmail.com",
        f"{first_name.lower()}{last_name.lower()}@gmail.com",
        f"{first_name.lower()}_{last_name.lower()}@yahoo.com",
        f"{first_name[0].lower()}{last_name.lower()}@gmail.com",
        f"{first_name.lower()}{random.randint(1, 99)}@gmail.com"
    ]
    return random.choice(variations)


def generate_phone() -> str:
    """Generate Serbian phone number."""
    return f"+38160{random.randint(1000000, 9999999)}"


def generate_linkedin(first_name: str, last_name: str) -> str:
    """Generate LinkedIn URL."""
    return f"https://linkedin.com/in/{first_name.lower()}{last_name.lower()}"


def generate_github(first_name: str, last_name: str) -> str:
    """Generate GitHub URL."""
    variations = [
        f"https://github.com/{first_name.lower()}{last_name.lower()}",
        f"https://github.com/{first_name.lower()}-{last_name.lower()}",
        f"https://github.com/{first_name.lower()}{random.randint(1, 999)}"
    ]
    return random.choice(variations)


async def seed_bulk_applications():
    """Create 1000 bulk applications for Junior Python Backend Developer job."""
    print("\n" + "="*70)
    print("BULK APPLICATION SEEDING - 1000 Applications")
    print("="*70)
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DB_NAME]
    
    users_collection = db["users"]
    jobs_collection = db["jobs"]
    applications_collection = db["applications"]
    
    # Find the Junior Python Backend Developer job
    print("\nStep 1: Finding Junior Python Backend Developer job...")
    python_job = await jobs_collection.find_one({"title": "Junior Python Backend Developer"})
    
    if not python_job:
        print("❌ Error: Junior Python Backend Developer job not found!")
        print("   Please run seed_database.py first to create the job.")
        return
    
    job_id = str(python_job["_id"])
    print(f"✓ Found job: {python_job['title']} (ID: {job_id})")
    
    # Delete existing applications for this job
    print("\nStep 2: Deleting existing applications for this job...")
    existing_applications = await applications_collection.find({"job_id": job_id}).to_list(length=None)
    
    if existing_applications:
        # Get user IDs from existing applications
        user_ids_to_delete = [app["user_id"] for app in existing_applications]
        
        # Delete applications
        deleted_apps = await applications_collection.delete_many({"job_id": job_id})
        print(f"✓ Deleted {deleted_apps.deleted_count} applications")
        
        # Delete users who only applied to this job
        deleted_users = await users_collection.delete_many({
            "_id": {"$in": [ObjectId(uid) for uid in user_ids_to_delete]},
            "applications_count": {"$lte": 1}
        })
        print(f"✓ Deleted {deleted_users.deleted_count} users")
    else:
        print("✓ No existing applications to delete")
    
    # Generate 1000 users and applications
    print("\nStep 3: Generating 1000 users and applications...")
    print("   This may take a minute...\n")
    
    users_data = []
    applications_data = []
    
    for i in range(1000):
        # Generate random user data
        first_name = random.choice(FIRST_NAMES)
        last_name = random.choice(LAST_NAMES)
        full_name = f"{first_name} {last_name}"
        email = generate_email(first_name, last_name)
        city = random.choice(CITIES)
        years_exp = random.randint(0, 4)
        
        # Create user
        user = {
            "email": email,
            "full_name": full_name,
            "phone": generate_phone(),
            "location": f"{city}, Serbia",
            "linkedin_url": generate_linkedin(first_name, last_name),
            "github_url": generate_github(first_name, last_name),
            "bio": random.choice(BIO_TEMPLATES).format(years_exp),
            "applications_count": 1,
            "created_at": datetime.utcnow() - timedelta(days=random.randint(30, 180)),
            "updated_at": datetime.utcnow() - timedelta(days=random.randint(0, 30))
        }
        
        # Add optional fields randomly
        if random.random() > 0.5:
            user["portfolio_url"] = f"https://{first_name.lower()}{last_name.lower()}.dev"
        if random.random() > 0.3:
            user["resume_url"] = f"https://storage.example.com/resumes/{email.split('@')[0]}.pdf"
        
        users_data.append(user)
        
        # Progress indicator
        if (i + 1) % 100 == 0:
            print(f"   Generated {i + 1}/1000 users...")
    
    # Insert users in bulk
    print("\nStep 4: Inserting 1000 users into database...")
    result = await users_collection.insert_many(users_data)
    user_ids = [str(uid) for uid in result.inserted_ids]
    print(f"✓ Inserted {len(user_ids)} users")
    
    # Create applications for each user
    print("\nStep 5: Creating 1000 applications...")
    for i, user_id in enumerate(user_ids):
        days_ago = random.randint(1, 60)
        status = random.choices(STATUSES, weights=STATUS_WEIGHTS)[0]
        years_exp = random.randint(0, 4)
        
        application = {
            "user_id": user_id,
            "job_id": job_id,
            "status": status,
            "applied_at": datetime.utcnow() - timedelta(days=days_ago),
            "updated_at": datetime.utcnow() - timedelta(days=random.randint(0, days_ago)),
            "additional_info": random.choice(ADDITIONAL_INFO_TEMPLATES).format(years_exp),
            "notes": random.choice(NOTES_TEMPLATES) if status in ["reviewed", "invited", "rejected"] else None,
            "reviewed_at": datetime.utcnow() - timedelta(days=random.randint(0, days_ago)) if status != "pending" else None
        }
        
        applications_data.append(application)
        
        # Progress indicator
        if (i + 1) % 100 == 0:
            print(f"   Created {i + 1}/1000 applications...")
    
    # Insert applications in bulk
    print("\nStep 6: Inserting 1000 applications into database...")
    result = await applications_collection.insert_many(applications_data)
    print(f"✓ Inserted {len(result.inserted_ids)} applications")
    
    # Update job applications_count
    print("\nStep 7: Updating job applications count...")
    total_apps = await applications_collection.count_documents({"job_id": job_id})
    await jobs_collection.update_one(
        {"_id": ObjectId(job_id)},
        {"$set": {"applications_count": total_apps}}
    )
    print(f"✓ Updated job applications count to {total_apps}")
    
    # Print statistics
    print("\n" + "="*70)
    print("STATISTICS")
    print("="*70)
    
    status_counts = {}
    for status in STATUSES:
        count = await applications_collection.count_documents({
            "job_id": job_id,
            "status": status
        })
        status_counts[status] = count
        print(f"  {status.capitalize()}: {count} applications")
    
    print(f"\n  Total applications for '{python_job['title']}': {total_apps}")
    print("\n✅ Bulk seeding completed successfully!")
    print("="*70 + "\n")
    
    client.close()


if __name__ == "__main__":
    asyncio.run(seed_bulk_applications())
