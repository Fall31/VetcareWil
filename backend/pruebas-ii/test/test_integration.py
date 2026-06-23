import pytest
import os
from fastapi.testclient import TestClient
from app.main import app
from app import crud

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_integration_db (monkeypatch):
    test_db = "app/integration_db.json"
    monkeypatch.setattr(
        crud,
        "DB_FILE",
        test_db
    )
    yield
    if os.path.exists(test_db):
        os.remove(test_db)

# 1 Test: Endpoint POST /categorias crear y persitir
def test_api_create_categoria():
    response = client.post("/categorias?nombre=Hogar")
    print(f"\n [DEBUG INTEGRATION] POST /categorias -> Status: {response.status_code} | Body: {response.json()}")
    assert response.status_code == 200
    assert response.json()["nombre"] == "Hogar"
    assert response.json()["id"] == 1

#2 usar ambas apis
def test_api_create_producto_exitoso():
    # 1. Crear categoría vía API
    client.post("/categorias?nombre=Electronica")
    
    # 2. Crear producto asociado a la categoría ID 1
    response = client.post("/productos?nombre=Laptop&categoria_id=1")
    
    print(f"\n [DEBUG INTEGRATION] POST /productos -> Status: {response.status_code} | Body: {response.json()}")
    
    assert response.status_code == 200
    data = response.json()
    assert data["nombre"] == "Laptop"
    assert data["categoria_id"] == 1
    assert data["id"] == 101  # Basado en tu lógica de max(id, 100) + 1

    # 3. Verificar persistencia consultando el endpoint GET
    get_response = client.get("/productos")
    assert len(get_response.json()) == 1
    assert get_response.json()[0]["nombre"] == "Laptop"

# 3 error de categoriadef test_api_create_producto_error_404():
    # Intentamos crear un producto para una categoría que no existe (ID 999)
    response = client.post("/productos?nombre=Inexistente&categoria_id=999")
    
    print(f"\n [DEBUG INTEGRATION] POST /productos (Error) -> Status: {response.status_code} | Body: {response.json()}")
    
    # Verificamos que FastAPI responda con el código de estado y detalle correctos
    assert response.status_code == 404
    assert response.json()["detail"] == "Categoría no encontrada"
# probar los codes que recibe la respuesta
#404, 403, 401, 500 