var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
// ==== Sujeto concreto: Pedido (implementa Observable) ====
var Pedido = /** @class */ (function () {
    function Pedido() {
        this.estado = "Creado";
        this.observers = [];
        this.originalObservers = [];
    }
    Pedido.prototype.suscribirse = function (o) {
        var _this = this;
        if (!this.observers.includes(o))
            this.observers.push(o);
        if (!this.originalObservers.includes(o))
            this.originalObservers.push(o);
        return function () { return _this.desuscribirse(o); };
    };
    Pedido.prototype.desuscribirse = function (o) {
        var i = this.observers.indexOf(o);
        if (i >= 0)
            this.observers.splice(i, 1);
    };
    Pedido.prototype.notify = function (e) {
        // Crear una copia del array para evitar problemas si alguien se desuscribe durante notify
        var observersCopy = __spreadArray([], this.observers, true);
        observersCopy.forEach(function (o) { return o.update(e); });
    };
    Pedido.prototype.ev = function (tipo) {
        return { tipo: tipo, estado: this.estado, ts: new Date().toLocaleTimeString() };
    };
    // --- Transiciones (cambian estado y notifican) ---
    Pedido.prototype.marcarPreparandose = function () {
        if (this.estado === "Creado") {
            this.estado = "Preparándose";
            this.notify(this.ev("Preparandose"));
        }
    };
    Pedido.prototype.marcarListo = function () {
        if (this.estado === "Preparándose") {
            this.estado = "Listo";
            this.notify(this.ev("Listo"));
        }
    };
    Pedido.prototype.marcarEnCamino = function () {
        if (this.estado === "Listo") {
            this.estado = "En camino";
            this.notify(this.ev("EnCamino"));
        }
    };
    Pedido.prototype.marcarEntregado = function () {
        if (this.estado === "En camino") {
            this.estado = "Entregado";
            this.notify(this.ev("Entregado"));
        }
    };
    Pedido.prototype.reset = function () {
        var _this = this;
        this.estado = "Creado";
        this.originalObservers.forEach(function (observer) {
            if (!_this.observers.includes(observer)) {
                _this.observers.push(observer);
            }
        });
        this.notify(this.ev("Reinicio"));
    };
    Pedido.prototype.getEstado = function () {
        return this.estado;
    };
    Pedido.prototype.getObserversCount = function () {
        return this.observers.length;
    };
    return Pedido;
}());
// ==== Observadores concretos (cada uno IMPLEMENTA Observer) ====
var CocinaObserver = /** @class */ (function () {
    function CocinaObserver(pedido, logEl, statusEl) {
        this.pedido = pedido;
        this.logEl = logEl;
        this.statusEl = statusEl;
        this.unsubscribe = null;
        this.isSubscribed = false;
        this.subscribe();
    }
    CocinaObserver.prototype.subscribe = function () {
        if (!this.isSubscribed) {
            this.unsubscribe = this.pedido.suscribirse(this);
            this.isSubscribed = true;
            this.updateStatusIndicator();
        }
    };
    CocinaObserver.prototype.unsubscribeFromPedido = function () {
        if (this.unsubscribe && this.isSubscribed) {
            this.unsubscribe();
            this.unsubscribe = null;
            this.isSubscribed = false;
            this.updateStatusIndicator();
        }
    };
    CocinaObserver.prototype.updateStatusIndicator = function () {
        this.statusEl.className = "status-indicator ".concat(this.isSubscribed ? "subscribed" : "unsubscribed");
    };
    CocinaObserver.prototype.escribir = function (msg) {
        var div = document.createElement("div");
        div.textContent = msg;
        this.logEl.prepend(div);
    };
    CocinaObserver.prototype.update = function (e) {
        var _a;
        var map = {
            Preparandose: "Cocinando… 🔪🔥",
            Listo: "Listo para retirar 🧾",
            Reinicio: "Nuevo ticket - Re-suscrito ✨",
        };
        this.escribir("[".concat(e.ts, "] ").concat((_a = map[e.tipo]) !== null && _a !== void 0 ? _a : "Estado: ".concat(e.estado)));
        if (e.tipo === "Reinicio") {
            this.isSubscribed = true;
            this.updateStatusIndicator();
        }
        // Auto-desuscribir cocina cuando termina su fase (Listo)
        else if (e.tipo === "Listo") {
            this.unsubscribeFromPedido();
            this.escribir("(Cocina se auto-desuscribe: ya terminó su fase)");
        }
    };
    return CocinaObserver;
}());
var RepartidorObserver = /** @class */ (function () {
    function RepartidorObserver(pedido, logEl, statusEl) {
        this.pedido = pedido;
        this.logEl = logEl;
        this.statusEl = statusEl;
        this.unsubscribe = null;
        this.isSubscribed = false;
        this.subscribe();
    }
    RepartidorObserver.prototype.subscribe = function () {
        if (!this.isSubscribed) {
            this.unsubscribe = this.pedido.suscribirse(this);
            this.isSubscribed = true;
            this.updateStatusIndicator();
        }
    };
    RepartidorObserver.prototype.unsubscribeFromPedido = function () {
        if (this.unsubscribe && this.isSubscribed) {
            this.unsubscribe();
            this.unsubscribe = null;
            this.isSubscribed = false;
            this.updateStatusIndicator();
        }
    };
    RepartidorObserver.prototype.updateStatusIndicator = function () {
        this.statusEl.className = "status-indicator ".concat(this.isSubscribed ? "subscribed" : "unsubscribed");
    };
    RepartidorObserver.prototype.escribir = function (msg) {
        var div = document.createElement("div");
        div.textContent = msg;
        this.logEl.prepend(div);
    };
    RepartidorObserver.prototype.update = function (e) {
        var _a;
        var map = {
            Preparandose: "Esperando en cocina…",
            Listo: "¡Retirá el pedido! 📦",
            EnCamino: "En camino al cliente ▶️",
            Entregado: "Entrega confirmada ✅",
            Reinicio: "Sin asignación - Re-suscrito ✨",
        };
        this.escribir("[".concat(e.ts, "] ").concat((_a = map[e.tipo]) !== null && _a !== void 0 ? _a : "Estado: ".concat(e.estado)));
        if (e.tipo === "Reinicio") {
            this.isSubscribed = true;
            this.updateStatusIndicator();
        }
        // Auto-desuscribir repartidor cuando termina su fase (Entregado)
        else if (e.tipo === "Entregado") {
            this.unsubscribeFromPedido();
            this.escribir("(Repartidor se auto-desuscribe: ya terminó su fase)");
        }
    };
    return RepartidorObserver;
}());
var ClienteObserver = /** @class */ (function () {
    function ClienteObserver(pedido, logEl, statusEl) {
        this.pedido = pedido;
        this.logEl = logEl;
        this.statusEl = statusEl;
        this.unsubscribe = null;
        this.isSubscribed = false;
        this.subscribe();
    }
    ClienteObserver.prototype.subscribe = function () {
        if (!this.isSubscribed) {
            this.unsubscribe = this.pedido.suscribirse(this);
            this.isSubscribed = true;
            this.updateStatusIndicator();
        }
    };
    ClienteObserver.prototype.updateStatusIndicator = function () {
        this.statusEl.className = "status-indicator ".concat(this.isSubscribed ? "subscribed" : "unsubscribed");
    };
    ClienteObserver.prototype.escribir = function (msg) {
        var div = document.createElement("div");
        div.textContent = msg;
        this.logEl.prepend(div);
    };
    ClienteObserver.prototype.update = function (e) {
        var _a;
        var map = {
            Preparandose: "Tu pedido está preparándose 👩‍🍳",
            Listo: "Tu pedido está listo para salir ✅",
            EnCamino: "¡Tu pedido va en camino! 🛵",
            Entregado: "¡Que lo disfrutes! 🎉",
            Reinicio: "Se inició un nuevo pedido ✨",
        };
        this.escribir("[".concat(e.ts, "] ").concat((_a = map[e.tipo]) !== null && _a !== void 0 ? _a : "Estado: ".concat(e.estado)));
        // No se auto-desuscribe para poder ver el estado completo del pedido
    };
    return ClienteObserver;
}());
// ==== Wiring UI (mínimo) ====
var estadoGlobal = document.getElementById("estado-global");
var btnPrep = document.getElementById("btn-prep");
var btnListo = document.getElementById("btn-listo");
var btnEnCamino = document.getElementById("btn-en-camino");
var btnEntregado = document.getElementById("btn-entregado");
var btnReset = document.getElementById("reset");
var logCocina = document.getElementById("log-cocina");
var logRepa = document.getElementById("log-repa");
var logCliente = document.getElementById("log-cliente");
var cocinaStatus = document.getElementById("cocina-status");
var repartidorStatus = document.getElementById("repartidor-status");
var clienteStatus = document.getElementById("cliente-status");
var pedido = new Pedido();
// Observador liviano para "Estado actual" (otro Observer concreto inline)
pedido.suscribirse({
    update: function () {
        estadoGlobal.textContent = pedido.getEstado();
    },
});
estadoGlobal.textContent = pedido.getEstado();
var cocinaObserver = new CocinaObserver(pedido, logCocina, cocinaStatus);
var repartidorObserver = new RepartidorObserver(pedido, logRepa, repartidorStatus);
var clienteObserver = new ClienteObserver(pedido, logCliente, clienteStatus);
// Acciones → cambian estado del SUJETO (no desde update)
btnPrep.onclick = function () {
    pedido.marcarPreparandose();
    refreshButtons();
};
btnListo.onclick = function () {
    pedido.marcarListo();
    refreshButtons();
};
btnEnCamino.onclick = function () {
    pedido.marcarEnCamino();
    refreshButtons();
};
btnEntregado.onclick = function () {
    pedido.marcarEntregado();
    refreshButtons();
};
btnReset.onclick = function () {
    logCocina.innerHTML = "";
    logRepa.innerHTML = "";
    logCliente.innerHTML = "";
    pedido.reset();
    refreshButtons();
};
// UX: deshabilitar botones según estado
function refreshButtons() {
    var st = pedido.getEstado();
    btnPrep.disabled = !(st === "Creado");
    btnListo.disabled = !(st === "Preparándose");
    btnEnCamino.disabled = !(st === "Listo");
    btnEntregado.disabled = !(st === "En camino");
}
refreshButtons();
