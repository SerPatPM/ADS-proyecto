"""test_motor.py — Tests del nuevo motor de propagación por bits."""
import pytest
from compartido.modelos import Red, Nodo, Arista
from motor.algoritmos import obtener_motor, has_pos, has_neg, add_pos, add_neg

def _red(*nodos_args, aristas_args=None):
    nodos   = [Nodo(**a) for a in nodos_args]
    aristas = [Arista(**a) for a in (aristas_args or [])]
    return Red(id="test", nodos=nodos, aristas=aristas)

class TestBitHelpers:
    def test_has_pos(self):
        assert has_pos("T") and has_pos("B") and not has_pos("F") and not has_pos("N")
    def test_has_neg(self):
        assert has_neg("F") and has_neg("B") and not has_neg("T") and not has_neg("N")
    def test_add_pos(self):
        assert add_pos("N")=="T"; assert add_pos("F")=="B"; assert add_pos("T")=="T"; assert add_pos("B")=="B"
    def test_add_neg(self):
        assert add_neg("N")=="F"; assert add_neg("T")=="B"; assert add_neg("F")=="F"; assert add_neg("B")=="B"

class TestNOT:
    def test_forward_T_da_F(self):
        red = _red({"id":"nodo-A","etiqueta":"A","valor":"T"},
                   {"id":"nodo-nA","etiqueta":"¬A"},
                   aristas_args=[{"id":"arista-1","id_origen":"nodo-A","id_destino":"nodo-nA","tipo":"not"}])
        r = obtener_motor().calcular(red)
        assert r.valores_nodos["nodo-nA"] == "F"

    def test_backward_T_da_F(self):
        red = _red({"id":"nodo-A","etiqueta":"A"},
                   {"id":"nodo-nA","etiqueta":"¬A","valor":"T"},
                   aristas_args=[{"id":"arista-1","id_origen":"nodo-A","id_destino":"nodo-nA","tipo":"not"}])
        r = obtener_motor().calcular(red)
        assert r.valores_nodos["nodo-A"] == "F"

    def test_doble_negacion(self):
        red = _red({"id":"nodo-A","etiqueta":"A","valor":"T"},
                   {"id":"nodo-nA","etiqueta":"¬A"},
                   {"id":"nodo-nnA","etiqueta":"¬¬A"},
                   aristas_args=[
                       {"id":"arista-1","id_origen":"nodo-A","id_destino":"nodo-nA","tipo":"not"},
                       {"id":"arista-2","id_origen":"nodo-nA","id_destino":"nodo-nnA","tipo":"not"},
                   ])
        r = obtener_motor().calcular(red)
        assert r.valores_nodos["nodo-A"]   == "T"
        assert r.valores_nodos["nodo-nA"]  == "F"
        assert r.valores_nodos["nodo-nnA"] == "T"

class TestAND:
    def test_and_i(self):
        red = _red({"id":"nodo-A","etiqueta":"A","valor":"T"},
                   {"id":"nodo-B","etiqueta":"B","valor":"T"},
                   {"id":"nodo-AB","etiqueta":"A∧B"},
                   aristas_args=[
                       {"id":"arista-1","id_origen":"nodo-AB","id_destino":"nodo-A","tipo":"and"},
                       {"id":"arista-2","id_origen":"nodo-AB","id_destino":"nodo-B","tipo":"and"},
                   ])
        r = obtener_motor().calcular(red)
        assert r.valores_nodos["nodo-AB"] == "T"

    def test_and_e(self):
        red = _red({"id":"nodo-AB","etiqueta":"A∧B","valor":"T"},
                   {"id":"nodo-A","etiqueta":"A"},
                   {"id":"nodo-B","etiqueta":"B"},
                   aristas_args=[
                       {"id":"arista-1","id_origen":"nodo-AB","id_destino":"nodo-A","tipo":"and"},
                       {"id":"arista-2","id_origen":"nodo-AB","id_destino":"nodo-B","tipo":"and"},
                   ])
        r = obtener_motor().calcular(red)
        assert r.valores_nodos["nodo-A"] == "T"
        assert r.valores_nodos["nodo-B"] == "T"

    def test_and_neg_backward(self):
        red = _red({"id":"nodo-A","etiqueta":"A","valor":"F"},
                   {"id":"nodo-B","etiqueta":"B"},
                   {"id":"nodo-AB","etiqueta":"A∧B"},
                   aristas_args=[
                       {"id":"arista-1","id_origen":"nodo-AB","id_destino":"nodo-A","tipo":"and"},
                       {"id":"arista-2","id_origen":"nodo-AB","id_destino":"nodo-B","tipo":"and"},
                   ])
        r = obtener_motor().calcular(red)
        assert has_neg(r.valores_nodos["nodo-AB"])  # A∧B must be false

class TestOR:
    def test_or_i(self):
        red = _red({"id":"nodo-A","etiqueta":"A","valor":"T"},
                   {"id":"nodo-B","etiqueta":"B"},
                   {"id":"nodo-AB","etiqueta":"A∨B"},
                   aristas_args=[
                       {"id":"arista-1","id_origen":"nodo-A","id_destino":"nodo-AB","tipo":"or"},
                       {"id":"arista-2","id_origen":"nodo-B","id_destino":"nodo-AB","tipo":"or"},
                   ])
        r = obtener_motor().calcular(red)
        assert r.valores_nodos["nodo-AB"] == "T"

    def test_or_e_backward(self):
        red = _red({"id":"nodo-AB","etiqueta":"A∨B","valor":"F"},
                   {"id":"nodo-A","etiqueta":"A"},
                   {"id":"nodo-B","etiqueta":"B"},
                   aristas_args=[
                       {"id":"arista-1","id_origen":"nodo-A","id_destino":"nodo-AB","tipo":"or"},
                       {"id":"arista-2","id_origen":"nodo-B","id_destino":"nodo-AB","tipo":"or"},
                   ])
        r = obtener_motor().calcular(red)
        assert r.valores_nodos["nodo-A"] == "F"
        assert r.valores_nodos["nodo-B"] == "F"

class TestUI:
    def test_modus_ponens(self):
        red = _red({"id":"nodo-A","etiqueta":"A","valor":"T"},
                   {"id":"nodo-B","etiqueta":"B"},
                   aristas_args=[{"id":"arista-1","id_origen":"nodo-A","id_destino":"nodo-B","tipo":"ui"}])
        r = obtener_motor().calcular(red)
        assert r.valores_nodos["nodo-B"] == "T"

    def test_modus_tollens_backward(self):
        red = _red({"id":"nodo-A","etiqueta":"A"},
                   {"id":"nodo-B","etiqueta":"B","valor":"F"},
                   aristas_args=[{"id":"arista-1","id_origen":"nodo-A","id_destino":"nodo-B","tipo":"ui"}])
        r = obtener_motor().calcular(red)
        assert r.valores_nodos["nodo-A"] == "F"

class TestContradiccion:
    def test_B_se_propaga(self):
        red = _red({"id":"nodo-A","etiqueta":"A","valor":"B"},
                   {"id":"nodo-nA","etiqueta":"¬A"},
                   aristas_args=[{"id":"arista-1","id_origen":"nodo-A","id_destino":"nodo-nA","tipo":"not"}])
        r = obtener_motor().calcular(red)
        assert r.valores_nodos["nodo-nA"] == "B"
