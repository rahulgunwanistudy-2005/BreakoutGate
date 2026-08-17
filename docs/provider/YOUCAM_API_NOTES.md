# Perfect Corp / YouCam AI API Specification & Integration Notes

**Author**: Lead Staff Engineer / Claude Provider Engineer  
**Status**: Authoritative Reference Baseline  
**Verified Against**: Official Perfect Corp Documentation (`https://docs.perfectcorp.com`, `https://yce.makeupar.com/ai-api`)  

---

## 1. Authentication

* **Header Format**: `Authorization: Bearer <API_KEY>`
* **Key Generation**: Created via the Perfect Corp Developer Console (`https://yce.makeupar.com/api-console/en/api-keys/`).
* **Security Invariant**: API Keys are server-side only. Never exposed to browser bundles or client code.

---

## 2. API Endpoints Overview

| Operation | Method | Endpoint Path | Description |
|---|---|---|---|
| **File Upload (Init)** | `POST` | `/s2s/v2.0/file` | Initializes file upload or accepts image buffer/URL, returning a `file_id` |
| **Skin Analysis Task** | `POST` | `/s2s/v2.0/task/skin-analysis` | Initiates asynchronous skin analysis task using `src_file_id` |
| **Skin Analysis Poll** | `GET` | `/s2s/v2.0/task/skin-analysis/{task_id}` | Polls status of skin analysis task |
| **Makeup VTO Task** | `POST` | `/s2s/v2.0/task/makeup-vto` | Initiates asynchronous makeup virtual try-on task using `src_file_id` + look parameters |
| **Makeup VTO Poll** | `GET` | `/s2s/v2.0/task/makeup-vto/{task_id}` | Polls status of virtual try-on task and returns generated image artifact |

---

## 3. Detailed Request / Response Structures

### A. File Upload (`POST /s2s/v2.0/file`)

#### Request
```http
POST /s2s/v2.0/file HTTP/1.1
Host: api.perfectcorp.com
Authorization: Bearer <YOUCAM_API_KEY>
Content-Type: multipart/form-data (or application/json with base64/url)
```

#### Successful Response (`200 OK`)
```json
{
  "status": 200,
  "result": {
    "file_id": "fl_f829a1b0c9384",
    "requests": {
      "url": "https://storage.perfectcorp.com/upload-target",
      "method": "PUT"
    }
  }
}
```

---

### B. Skin Analysis Task (`POST /s2s/v2.0/task/skin-analysis`)

#### Request
```json
{
  "src_file_id": "fl_f829a1b0c9384",
  "dst_actions": [
    "spots",
    "wrinkles",
    "texture",
    "dark_circles",
    "redness",
    "oiliness",
    "moisture",
    "pores",
    "radiance",
    "firmness"
  ]
}
```

#### Successful Response (`200 OK`)
```json
{
  "status": 200,
  "result": {
    "task_id": "tsk_sk_7b382910a"
  }
}
```

---

### C. Task Status Polling (`GET /s2s/v2.0/task/{task_type}/{task_id}`)

#### Polling States
* `pending`: Task is queued in provider scheduler.
* `processing`: Task is executing through the AI model pipeline.
* `success`: Task completed successfully with results available in `result`.
* `error`: Task failed with error details in `error` or `result.error`.

#### Successful Skin Analysis Poll Response (`200 OK`)
```json
{
  "status": 200,
  "result": {
    "task_status": "success",
    "task_id": "tsk_sk_7b382910a",
    "output": {
      "skin_analysis": {
        "acne": { "score": 72, "level": 3 },
        "redness": { "score": 61, "level": 2 },
        "oiliness": { "score": 58, "level": 2 },
        "moisture": { "score": 35, "level": 1 },
        "texture": { "score": 66, "level": 3 },
        "pores": { "score": 54, "level": 2 }
      },
      "face_info": {
        "box": [120, 80, 480, 520]
      }
    }
  }
}
```

---

### D. Makeup VTO Task (`POST /s2s/v2.0/task/makeup-vto`)

#### Request
```json
{
  "src_file_id": "fl_f829a1b0c9384",
  "looks": [
    {
      "category": "foundation",
      "shade_code": "WARM_BEIGE_03",
      "intensity": 0.85,
      "finish": "natural"
    }
  ]
}
```

#### Polling Result (`GET /s2s/v2.0/task/makeup-vto/{task_id}`)
```json
{
  "status": 200,
  "result": {
    "task_status": "success",
    "task_id": "tsk_vto_98a7c2b",
    "output": {
      "artifact_url": "https://cdn.perfectcorp.com/vto/tsk_vto_98a7c2b.png",
      "width": 1024,
      "height": 1024
    }
  }
}
```

---

## 4. Error Codes and Normalization

| HTTP Status | Provider Error Code | Description | Normalized Internal Error | Retryable? |
|---|---|---|---|---|
| `400` | `INVALID_PARAMETER` | Malformed body, missing required fields | `INVALID_REQUEST` | No |
| `400` | `INVALID_IMAGE` | Unrecognized image format, corrupted payload | `INVALID_IMAGE` | No |
| `401` | `AUTHENTICATION_ERROR` | Missing or invalid Bearer token | `AUTHENTICATION_ERROR` | No |
| `403` | `QUOTA_EXCEEDED` / `FORBIDDEN` | Exhausted API credits or unauthorized endpoint | `AUTHORIZATION_ERROR` | No |
| `429` | `RATE_LIMIT_EXCEEDED` | Too many requests per second | `RATE_LIMITED` | Yes (with backoff) |
| `500` | `INTERNAL_SERVER_ERROR` | Provider unexpected failure | `PROVIDER_UNAVAILABLE` | Yes (bounded, 3x) |
| `503` | `SERVICE_UNAVAILABLE` | Provider maintenance or outage | `PROVIDER_UNAVAILABLE` | Yes (bounded, 3x) |
| `200` | `task_status: "error"` | AI processing failure (e.g. no face detected) | `PROVIDER_TASK_FAILED` | No |

---

## 5. Input Validation Constraints

* **MIME Types**: `image/jpeg`, `image/png`, `image/webp`.
* **Max Payload Size**: 10 MB (10,485,760 bytes).
* **Dimensions**: Min 480x480, Max 4096x4096.
* **Privacy**: Raw face image buffers are held only in ephemeral memory during the request lifecycle. No raw images or base64 payloads are written to logs.
