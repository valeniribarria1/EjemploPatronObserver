type EventoTipo =
  | "Preparandose"
  | "Listo"
  | "EnCamino"
  | "Entregado"
  | "Reinicio";
type Evento = { tipo: EventoTipo; estado: string; ts: string };

// ==== Contratos del patrón (interfaces) ====
interface Observer {
  update(evento: Evento): void;
}

interface Subject {
  suscribirse(o: Observer): () => void;
  desuscribirse(o: Observer): void;
  notify(e: Evento): void;
}

// ==== Sujeto concreto: Pedido (implementa Observable) ====
class Pedido implements Subject {
  private estado = "Creado";
  private observers: Observer[] = [];
  private originalObservers: Observer[] = [];

  suscribirse(o: Observer): () => void {
    if (!this.observers.includes(o)) this.observers.push(o);
    if (!this.originalObservers.includes(o)) this.originalObservers.push(o);
    return () => this.desuscribirse(o);
  }

  desuscribirse(o: Observer): void {
    const i = this.observers.indexOf(o);
    if (i >= 0) this.observers.splice(i, 1);
  }

  notify(e: Evento): void {
    // Crear una copia del array para evitar problemas si alguien se desuscribe durante notify
    const observersCopy = [...this.observers];
    observersCopy.forEach((o) => o.update(e));
  }

  private ev(tipo: EventoTipo): Evento {
    return { tipo, estado: this.estado, ts: new Date().toLocaleTimeString() };
  }

  // --- Transiciones (cambian estado y notifican) ---
  marcarPreparandose() {
    if (this.estado === "Creado") {
      this.estado = "Preparándose";
      this.notify(this.ev("Preparandose"));
    }
  }
  marcarListo() {
    if (this.estado === "Preparándose") {
      this.estado = "Listo";
      this.notify(this.ev("Listo"));
    }
  }
  marcarEnCamino() {
    if (this.estado === "Listo") {
      this.estado = "En camino";
      this.notify(this.ev("EnCamino"));
    }
  }
  marcarEntregado() {
    if (this.estado === "En camino") {
      this.estado = "Entregado";
      this.notify(this.ev("Entregado"));
    }
  }
  reset() {
    this.estado = "Creado";
    this.originalObservers.forEach((observer) => {
      if (!this.observers.includes(observer)) {
        this.observers.push(observer);
      }
    });
    this.notify(this.ev("Reinicio"));
  }

  getEstado() {
    return this.estado;
  }

  getObserversCount() {
    return this.observers.length;
  }
}

// ==== Observadores concretos (cada uno IMPLEMENTA Observer) ====

class CocinaObserver implements Observer {
  private unsubscribe: (() => void) | null = null;
  private isSubscribed = false;

  constructor(
    private pedido: Pedido,
    private logEl: HTMLElement,
    private statusEl: HTMLElement
  ) {
    this.subscribe();
  }

  private subscribe() {
    if (!this.isSubscribed) {
      this.unsubscribe = this.pedido.suscribirse(this);
      this.isSubscribed = true;
      this.updateStatusIndicator();
    }
  }

  private unsubscribeFromPedido() {
    if (this.unsubscribe && this.isSubscribed) {
      this.unsubscribe();
      this.unsubscribe = null;
      this.isSubscribed = false;
      this.updateStatusIndicator();
    }
  }

  private updateStatusIndicator() {
    this.statusEl.className = `status-indicator ${
      this.isSubscribed ? "subscribed" : "unsubscribed"
    }`;
  }

  private escribir(msg: string) {
    const div = document.createElement("div");
    div.textContent = msg;
    this.logEl.prepend(div);
  }

  update(e: Evento): void {
    const map: Record<string, string> = {
      Preparandose: "Cocinando… 🔪🔥",
      Listo: "Listo para retirar 🧾",
      Reinicio: "Nuevo ticket - Re-suscrito ✨",
    };
    this.escribir(`[${e.ts}] ${map[e.tipo] ?? `Estado: ${e.estado}`}`);

    if (e.tipo === "Reinicio") {
      this.isSubscribed = true;
      this.updateStatusIndicator();
    }
    // Auto-desuscribir cocina cuando termina su fase (Listo)
    else if (e.tipo === "Listo") {
      this.unsubscribeFromPedido();
      this.escribir("(Cocina se auto-desuscribe: ya terminó su fase)");
    }
  }
}

class RepartidorObserver implements Observer {
  private unsubscribe: (() => void) | null = null;
  private isSubscribed = false;

  constructor(
    private pedido: Pedido,
    private logEl: HTMLElement,
    private statusEl: HTMLElement
  ) {
    this.subscribe();
  }

  private subscribe() {
    if (!this.isSubscribed) {
      this.unsubscribe = this.pedido.suscribirse(this);
      this.isSubscribed = true;
      this.updateStatusIndicator();
    }
  }

  private unsubscribeFromPedido() {
    if (this.unsubscribe && this.isSubscribed) {
      this.unsubscribe();
      this.unsubscribe = null;
      this.isSubscribed = false;
      this.updateStatusIndicator();
    }
  }

  private updateStatusIndicator() {
    this.statusEl.className = `status-indicator ${
      this.isSubscribed ? "subscribed" : "unsubscribed"
    }`;
  }

  private escribir(msg: string) {
    const div = document.createElement("div");
    div.textContent = msg;
    this.logEl.prepend(div);
  }

  update(e: Evento): void {
    const map: Record<string, string> = {
      Preparandose: "Esperando en cocina…",
      Listo: "¡Retirá el pedido! 📦",
      EnCamino: "En camino al cliente ▶️",
      Entregado: "Entrega confirmada ✅",
      Reinicio: "Sin asignación - Re-suscrito ✨",
    };
    this.escribir(`[${e.ts}] ${map[e.tipo] ?? `Estado: ${e.estado}`}`);

    if (e.tipo === "Reinicio") {
      this.isSubscribed = true;
      this.updateStatusIndicator();
    }
    // Auto-desuscribir repartidor cuando termina su fase (Entregado)
    else if (e.tipo === "Entregado") {
      this.unsubscribeFromPedido();
      this.escribir("(Repartidor se auto-desuscribe: ya terminó su fase)");
    }
  }
}

class ClienteObserver implements Observer {
  private unsubscribe: (() => void) | null = null;
  private isSubscribed = false;

  constructor(
    private pedido: Pedido,
    private logEl: HTMLElement,
    private statusEl: HTMLElement
  ) {
    this.subscribe();
  }

  private subscribe() {
    if (!this.isSubscribed) {
      this.unsubscribe = this.pedido.suscribirse(this);
      this.isSubscribed = true;
      this.updateStatusIndicator();
    }
  }

  private updateStatusIndicator() {
    this.statusEl.className = `status-indicator ${
      this.isSubscribed ? "subscribed" : "unsubscribed"
    }`;
  }

  private escribir(msg: string) {
    const div = document.createElement("div");
    div.textContent = msg;
    this.logEl.prepend(div);
  }

  update(e: Evento): void {
    const map: Record<string, string> = {
      Preparandose: "Tu pedido está preparándose 👩‍🍳",
      Listo: "Tu pedido está listo para salir ✅",
      EnCamino: "¡Tu pedido va en camino! 🛵",
      Entregado: "¡Que lo disfrutes! 🎉",
      Reinicio: "Se inició un nuevo pedido ✨",
    };
    this.escribir(`[${e.ts}] ${map[e.tipo] ?? `Estado: ${e.estado}`}`);

    // No se auto-desuscribe para poder ver el estado completo del pedido
  }
}

// ==== Wiring UI (mínimo) ====
const estadoGlobal = document.getElementById(
  "estado-global"
) as HTMLSpanElement;

const btnPrep = document.getElementById("btn-prep") as HTMLButtonElement;
const btnListo = document.getElementById("btn-listo") as HTMLButtonElement;
const btnEnCamino = document.getElementById(
  "btn-en-camino"
) as HTMLButtonElement;
const btnEntregado = document.getElementById(
  "btn-entregado"
) as HTMLButtonElement;
const btnReset = document.getElementById("reset") as HTMLButtonElement;

const logCocina = document.getElementById("log-cocina") as HTMLDivElement;
const logRepa = document.getElementById("log-repa") as HTMLDivElement;
const logCliente = document.getElementById("log-cliente") as HTMLDivElement;

const cocinaStatus = document.getElementById(
  "cocina-status"
) as HTMLSpanElement;
const repartidorStatus = document.getElementById(
  "repartidor-status"
) as HTMLSpanElement;
const clienteStatus = document.getElementById(
  "cliente-status"
) as HTMLSpanElement;

const pedido = new Pedido();

// Observador liviano para "Estado actual" (otro Observer concreto inline)
pedido.suscribirse({
  update: () => {
    estadoGlobal.textContent = pedido.getEstado();
  },
});
estadoGlobal.textContent = pedido.getEstado();

const cocinaObserver = new CocinaObserver(pedido, logCocina, cocinaStatus);
const repartidorObserver = new RepartidorObserver(
  pedido,
  logRepa,
  repartidorStatus
);
const clienteObserver = new ClienteObserver(pedido, logCliente, clienteStatus);

// Acciones → cambian estado del SUJETO (no desde update)
btnPrep.onclick = () => {
  pedido.marcarPreparandose();
  refreshButtons();
};
btnListo.onclick = () => {
  pedido.marcarListo();
  refreshButtons();
};
btnEnCamino.onclick = () => {
  pedido.marcarEnCamino();
  refreshButtons();
};
btnEntregado.onclick = () => {
  pedido.marcarEntregado();
  refreshButtons();
};
btnReset.onclick = () => {
  logCocina.innerHTML = "";
  logRepa.innerHTML = "";
  logCliente.innerHTML = "";

  pedido.reset();
  refreshButtons();
};

// UX: deshabilitar botones según estado
function refreshButtons() {
  const st = pedido.getEstado();
  btnPrep.disabled = !(st === "Creado");
  btnListo.disabled = !(st === "Preparándose");
  btnEnCamino.disabled = !(st === "Listo");
  btnEntregado.disabled = !(st === "En camino");
}
refreshButtons();
