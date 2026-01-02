def test_read_root():
    """Test root endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    
    # ✅ Match actual response from main.py
    data = response.json()
    assert "name" in data
    assert "version" in data
    assert "status" in data
    assert data["name"] == "Prayer Tracker API"
    assert data["status"] == "running"


def test_health_check():
    """Test health endpoint."""
    response = client.get("/health")
    
    # Should return 200 if healthy, 503 if degraded
    assert response.status_code in [200, 503]
    
    # ✅ Match actual response structure
    data = response.json()
    assert "status" in data
    assert "service" in data
    assert "database" in data
    assert data["status"] in ["healthy", "degraded"]
    assert data["database"] in ["connected", "disconnected"]