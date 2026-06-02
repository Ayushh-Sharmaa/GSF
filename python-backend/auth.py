import os
import httpx
import jwt
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

bearer = HTTPBearer()


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Security(bearer),
) -> str:
    """FastAPI dependency — validates a Clerk-issued JWT and returns the user ID (sub)."""
    token = credentials.credentials

    clerk_domain = os.getenv("CLERK_DOMAIN")
    if not clerk_domain:
        raise HTTPException(
            status_code=500,
            detail="CLERK_DOMAIN is not configured on the server.",
        )

    jwks_url = f"https://{clerk_domain}/.well-known/jwks.json"

    async with httpx.AsyncClient() as client:
        resp = await client.get(jwks_url, timeout=10.0)
        resp.raise_for_status()
        jwks: dict = resp.json()

    public_keys: dict = {
        key["kid"]: jwt.algorithms.RSAAlgorithm.from_jwk(key)  # type: ignore[attr-defined]
        for key in jwks.get("keys", [])
    }

    try:
        header: dict = jwt.get_unverified_header(token)
    except jwt.DecodeError as exc:
        raise HTTPException(status_code=401, detail="Malformed token") from exc

    key = public_keys.get(header.get("kid", ""))
    if not key:
        raise HTTPException(status_code=401, detail="Token signing key not recognised")

    try:
        payload: dict = jwt.decode(
            token,
            key,  # type: ignore[arg-type]
            algorithms=["RS256"],
            options={"verify_aud": False},
        )
        return str(payload["sub"])
    except jwt.ExpiredSignatureError as exc:
        raise HTTPException(status_code=401, detail="Token expired") from exc
    except jwt.InvalidTokenError as exc:
        raise HTTPException(status_code=401, detail="Invalid token") from exc
