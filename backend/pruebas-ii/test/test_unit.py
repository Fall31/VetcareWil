import pytest
import os
from app import crud

@pytest.fixture(autouse=True)
def mock_db_path(monkeypatch):
    test_db = "app/test_db.json"
    monkeypatch.setattr(
        crud, 
        "DB_FILE",
        test_db)
    yield
    if os.path.exists(test_db):
        os.remove(test_db)

# 1.- Tst> Creacion exitosa de categoria
def test_create_categoria_unit ():
    res = crud.create_categoria_db("Lacteos")
    print (f"\n [DEBUG UNITARIOS] Resultado crud.create_categoria_db: {res}")
    assert res["nombre"] == "Lacteos"
    assert res["id"] == 1

#2 Test: Incremento de los id de categoria
def test_categoria_id_incremento():
    # Creamos la primera categoría
    cat1 = crud.create_categoria_db("Lacteos")
    # Creamos la segunda categoría
    cat2 = crud.create_categoria_db("Limpieza")
    
    assert cat1["id"] == 1
    assert cat2["id"] == 2
    assert cat2["nombre"] == "Limpieza"

# 3 Test: prodcuto sin categoria
def test_create_producto_categoria_inexistente():
    # Intentamos crear un producto con un ID de categoría que no existe (ej. 99)
    res = crud.create_producto_db("Leche Entera", 99)
    
    # Verificamos que devuelva el diccionario de error esperado
    assert "error" in res
    assert res["error"] == "Categoría no encontrada"
    
    # Verificamos que no se haya guardado nada en la lista de productos
    productos = crud.get_productos()
    assert len(productos) == 0

def test_create_producto_exitoso():
    # 1. Necesitamos una categoría real primero
    cat = crud.create_categoria_db("Frutas")
    cat_id = cat["id"]
    
    # 2. Creamos el producto asociado
    prod = crud.create_producto_db("Manzana", cat_id)
    
    assert prod["nombre"] == "Manzana"
    assert prod["categoria_id"] == cat_id
    assert prod["id"] == 101

