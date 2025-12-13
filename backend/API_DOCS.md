# Job Board API - Documentation

## 📋 Database Schema

### User Collection

Osnovni user profil za kandidate:

- `email` - Email adresa (unique)
- `full_name` - Ime i prezime
- `phone` - Telefon (optional)
- `location` - Lokacija (optional)
- `linkedin_url`, `github_url`, `portfolio_url` - Social links
- `resume_url` - Link ka CV-u
- `created_at`, `updated_at` - Timestamps

### Job Collection

Tech pozicije sa svim relevantnim poljima:

- `title` - Naziv pozicije
- `company` - Kompanija
- `location` - Lokacija
- `location_type` - remote | onsite | hybrid
- `job_type` - full-time | part-time | contract | internship | freelance
- `experience_level` - intern | junior | mid | senior | lead | staff
- `description` - Pun opis posla
- `responsibilities` - Lista odgovornosti
- `requirements` - Zahtevi (required skills)
- `nice_to_have` - Nice to have veštine
- `tech_stack` - Lista tehnologija
- `benefits` - Benefiti
- `salary_range` - {min, max, currency}
- `status` - active | closed | draft
- `applications_count` - Broj aplikacija
- `created_at`, `updated_at` - Timestamps

## 🚀 API Endpoints

### Jobs CRUD

**Base URL:** `http://localhost:8000/api/jobs`

#### 1. Create Job

```bash
POST /api/jobs/
Content-Type: application/json

{
  "title": "Senior Backend Engineer",
  "company": "TechCorp",
  "location": "Belgrade, Serbia",
  "location_type": "hybrid",
  "job_type": "full-time",
  "experience_level": "senior",
  "description": "Full job description...",
  "responsibilities": ["Task 1", "Task 2"],
  "requirements": ["Skill 1", "Skill 2"],
  "tech_stack": ["Python", "FastAPI", "MongoDB"],
  "benefits": ["Remote work", "Competitive salary"],
  "salary_range": {"min": 50000, "max": 80000, "currency": "USD"}
}
```

#### 2. Get All Jobs (with filters)

```bash
GET /api/jobs/?skip=0&limit=20
GET /api/jobs/?status=active
GET /api/jobs/?location_type=remote
GET /api/jobs/?experience_level=senior
```

#### 3. Get Single Job

```bash
GET /api/jobs/{job_id}
```

#### 4. Search Jobs

```bash
GET /api/jobs/search?q=React
GET /api/jobs/search?q=Python&limit=10
```

#### 5. Update Job

```bash
PUT /api/jobs/{job_id}
Content-Type: application/json

{
  "status": "closed"
}
```

#### 6. Delete Job

```bash
DELETE /api/jobs/{job_id}
```

## 📚 Interactive Documentation

FastAPI automatski generiše interaktivnu dokumentaciju:

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

## 🧪 Example Requests

### Kreiranje Full Stack pozicije

```bash
curl -X POST http://localhost:8000/api/jobs/ \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Full Stack Developer",
    "company": "InnovateTech",
    "location": "Novi Sad, Serbia",
    "location_type": "hybrid",
    "job_type": "full-time",
    "experience_level": "mid",
    "description": "Looking for a full stack developer...",
    "responsibilities": [
      "Develop frontend and backend features",
      "Write clean, maintainable code",
      "Participate in code reviews"
    ],
    "requirements": [
      "3+ years of full stack development",
      "React and Node.js experience",
      "SQL and NoSQL databases"
    ],
    "nice_to_have": [
      "TypeScript",
      "Docker",
      "CI/CD experience"
    ],
    "tech_stack": ["React", "Node.js", "MongoDB", "TypeScript", "Docker"],
    "benefits": [
      "Competitive salary",
      "Hybrid work model",
      "Health insurance",
      "Annual bonus"
    ],
    "salary_range": {
      "min": 45000,
      "max": 65000,
      "currency": "USD"
    }
  }'
```

### Pretraga Remote poslova

```bash
curl "http://localhost:8000/api/jobs/?location_type=remote&limit=10"
```

### Pretraga po tehnologiji

```bash
curl "http://localhost:8000/api/jobs/search?q=MongoDB"
```

## 🗄️ MongoDB Connection

Server automatski se povezuje na MongoDB Atlas pri startovanju.
Konfiguracija u `.env` fajlu:

```env
MONGODB_URL=mongodb+srv://user:pass@cluster.mongodb.net/?appName=App
MONGODB_DB_NAME=garaza_db
```

## ✅ Status

✅ MongoDB konekcija aktivna
✅ Job CRUD operacije funkcionalne
✅ Search i filtering rade
✅ API dokumentacija dostupna na /docs
