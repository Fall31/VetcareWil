from fastapi.testclient import TestClient
from app.main import app
import time
import json
client = TestClient(app)

def test_e2e_full_categoria_lifecycle():
    cat_nombre = f"E2E Categoria {int(time.time())}"
    response_get_initial = client.get("/categorias")
    initial_list = response_get_initial.json()
    initial_count = len(initial_list)
    print ("\n E2E: lista incial de categorias ----")
    print (json.dumps(initial_list, indent=4))
    print(f"Numero de categorias: {initial_count}")
    # paso 2 crear una nueva categoria
    response_post = client.post("/categorias", 
                                params= {"nombre": cat_nombre})
    assert response_post.status_code == 200
    categoria_creada = response_post.json()
    print("\n E2E CATEGORIA CREADA------")
    print(json.dumps(categoria_creada, indent=4))
    print("--------------------------------")
    #paso 3 verificar lista actual despues del post
    response_get_final = client.get("/categorias")
    lista_final = response_get_final.json()
    print ("\n E2E: lista final de categorias ----")
    print (json.dumps(lista_final, indent=4))
    print(f"Numero de categorias: {len(lista_final)}")
    assert len(lista_final) == initial_count + 1
    assert any(c['nombre'] == cat_nombre for c in lista_final)