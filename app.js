const API_URL        = "http://localhost:3000/productos";

const inputNombre    = document.getElementById("inputNombre");   
const inputPrecio    = document.getElementById("inputPrecio");   
const inputDesc      = document.getElementById("inputDesc");   
const btnAgregar     = document.getElementById("btnAgregar");    
const btnSincronizar = document.getElementById("btnSincronizar");
const listaProductos = document.querySelector("#listaProductos");
const mensajeEl      = document.querySelector("#mensaje");       
const contadorBadge  = document.querySelector("#contadorBadge"); 

// Modal de edición (TASK 5 - PUT)
const modalOverlay    = document.getElementById("modalOverlay");
const editNombre      = document.getElementById("editNombre");
const editPrecio      = document.getElementById("editPrecio");
const editDesc        = document.getElementById("editDesc");
const btnGuardarEdit  = document.getElementById("btnGuardarEdit");
const btnCancelarEdit = document.getElementById("btnCancelarEdit");

console.log("Referencias DOM:", { inputNombre, inputPrecio, listaProductos });

let productos  = JSON.parse(localStorage.getItem("productos")) || [];
let editandoId = null; // guarda el id del producto que se edita

console.log(` Productos cargados desde LocalStorage: ${productos.length}`);
productos.forEach(renderProducto); 
actualizarUI();

btnAgregar.addEventListener("click", agregarProducto);

function agregarProducto() {
  const nombre = inputNombre.value.trim();
  const precio = parseFloat(inputPrecio.value);
  const desc   = inputDesc.value.trim();

  if (!nombre)                    return mostrarMensaje(" El nombre es obligatorio.", "error");
  if (isNaN(precio) || precio < 0) return mostrarMensaje(" Ingresa un precio válido.", "error");
  if (!desc)                      return mostrarMensaje(" La descripción es obligatoria.", "error");

  const producto = { id: Date.now(), nombre, precio, desc };

  productos.push(producto);
  guardarStorage();

  renderProducto(producto);
  actualizarUI();

  inputNombre.value = "";
  inputPrecio.value = "";
  inputDesc.value   = "";
  inputNombre.focus();

  mostrarMensaje(` "${nombre}" agregado correctamente.`, "exito");
  console.log(" Producto agregado:", producto);
}

function renderProducto(producto) {
  const li       = document.createElement("li");
  const info     = document.createElement("div");
  const nombre   = document.createElement("strong");
  const detalle  = document.createElement("small");
  const precio   = document.createElement("span");
  const acciones = document.createElement("div");
  const btnEdit  = document.createElement("button");
  const btnDel   = document.createElement("button");

  nombre.textContent  = producto.nombre;
  detalle.textContent = producto.desc;
  precio.textContent  = `$${producto.precio.toFixed(2)}`;

  // Clases para estilos
  info.className     = "producto-info";
  precio.className   = "producto-precio";
  acciones.className = "producto-acciones";
  btnEdit.className  = "btn-editar";
  btnDel.className   = "btn-eliminar";
  btnEdit.textContent = "editar";
  btnDel.textContent  = "eliminar";
  li.dataset.id = producto.id;

  btnEdit.addEventListener("click", () => abrirModal(producto, li)); // abre modal PUT
  btnDel.addEventListener("click",  () => eliminarProducto(producto.id, li)); // elimina

  info.appendChild(nombre);
  info.appendChild(detalle);
  acciones.appendChild(btnEdit);
  acciones.appendChild(btnDel);
  li.appendChild(info);
  li.appendChild(precio);
  li.appendChild(acciones);

  listaProductos.appendChild(li); 
}

function eliminarProducto(id, li) {
  listaProductos.removeChild(li);             
  productos = productos.filter(p => p.id !== id); 
  guardarStorage();
  actualizarUI();
  fetchDeleteProducto(id);                    
  mostrarMensaje(" Producto eliminado.", "error");
  console.log(` Eliminado (id: ${id}) | Total: ${productos.length}`);
}

function guardarStorage() {
  localStorage.setItem("productos", JSON.stringify(productos));
  console.log(" LocalStorage actualizado:", productos);
}

btnSincronizar.addEventListener("click", async () => {
  mostrarMensaje("Cargando desde API...", "");
  try {
    const res  = await fetch(API_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    productos = data;
    guardarStorage();
    listaProductos.innerHTML = "";
    productos.forEach(renderProducto);
    actualizarUI();

    mostrarMensaje(` ${data.length} productos sincronizados.`, "exito");
    console.log("GET:", data);
  } catch (err) {
    mostrarMensaje(" No se pudo conectar con la API.", "error");
    console.error("Error GET:", err.message);
  }
});

async function fetchPostProducto(producto) {
  try {
    const res = await fetch(API_URL, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(producto)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    console.log("POST exitoso:", await res.json());
  } catch (err) {
    console.error("Error POST:", err.message);
  }
}

async function fetchPutProducto(producto) {
  try {
    const res = await fetch(`${API_URL}/${producto.id}`, {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(producto)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    console.log("PUT exitoso:", await res.json());
  } catch (err) {
    console.error("Error PUT:", err.message);
  }
}

async function fetchDeleteProducto(id) {
  try {
    const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    console.log(`DELETE exitoso (id: ${id})`);
  } catch (err) {
    console.error("Error DELETE:", err.message);
  }
}

function abrirModal(producto, li) {
  // Cargar valores actuales en el modal
  editNombre.value = producto.nombre;
  editPrecio.value = producto.precio;
  editDesc.value   = producto.desc;
  editandoId       = producto.id;
  modalOverlay.classList.remove("oculto");

  btnGuardarEdit.onclick = async () => {
    const nombre = editNombre.value.trim();
    const precio = parseFloat(editPrecio.value);
    const desc   = editDesc.value.trim();

    if (!nombre || isNaN(precio) || precio < 0 || !desc) {
      return console.warn("⚠ Datos inválidos en edición.");
    }

    const idx = productos.findIndex(p => p.id === editandoId);
    productos[idx] = { id: editandoId, nombre, precio, desc };
    guardarStorage();

    li.querySelector("strong").textContent          = nombre;
    li.querySelector("small").textContent           = desc;
    li.querySelector(".producto-precio").textContent = `$${precio.toFixed(2)}`;

    await fetchPutProducto(productos[idx]); // PUT a la API
    mostrarMensaje(` "${nombre}" actualizado.`, "exito");
    console.log("Producto actualizado:", productos[idx]);
    cerrarModal();
  };
}

btnCancelarEdit.addEventListener("click", cerrarModal);
modalOverlay.addEventListener("click", (e) => { if (e.target === modalOverlay) cerrarModal(); });

function cerrarModal() {
  modalOverlay.classList.add("oculto");
  editandoId = null;
}

function mostrarMensaje(texto, tipo) {
  mensajeEl.textContent = texto;
  mensajeEl.className   = tipo;
  setTimeout(() => { mensajeEl.textContent = ""; mensajeEl.className = ""; }, 3000);
}

function actualizarUI() {
  contadorBadge.textContent = productos.length;
  const vacio = listaProductos.querySelector(".empty");
  if (productos.length === 0 && !vacio) {
    const p = document.createElement("p");
    p.className   = "empty";
    p.textContent = "— sin productos —";
    listaProductos.appendChild(p);
  } else if (productos.length > 0 && vacio) {
    listaProductos.removeChild(vacio);
  }
}