const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "../projects/index.html"), "utf8");
const script = source.match(/<script>\s*([\s\S]*?)<\/script>/)[1];

function setup(hash = "") {
  const elements = new Map();
  const documentEvents = new Map();
  const windowEvents = new Map();
  const bodyClasses = new Set();
  const document = {
    activeElement: null,
    body: { classList: { add: (name) => bodyClasses.add(name), remove: (name) => bodyClasses.delete(name) } },
    getElementById: (id) => elements.get(id) || null,
    addEventListener: (name, fn) => documentEvents.set(name, fn)
  };
  const element = (id) => {
    const node = {
      hidden: true, disabled: false, dataset: {}, listeners: new Map(),
      addEventListener(name, fn) { this.listeners.set(name, fn); },
      focus() { document.activeElement = this; },
      scrollIntoView() { this.scrolled = true; }
    };
    elements.set(id, node);
    return node;
  };
  const region = element("nagpur-projects");
  region.open = false;
  region.closest = () => region;
  const target = element("knp-signature");
  target.closest = () => region;
  for (const id of ["project-lightbox", "lightbox-title", "lightbox-counter", "lightbox-image", "lightbox-caption", "lightbox-prev", "lightbox-next", "close"]) element(id);
  const modal = elements.get("project-lightbox");
  modal.querySelector = () => elements.get("close");
  modal.querySelectorAll = () => [elements.get("close")];
  const launchers = [...source.matchAll(/<button class="engagement-launch"[^>]+>/g)].map(([tag], index) => {
    const button = element("launcher-" + index);
    for (const [, key, value] of tag.matchAll(/data-([a-z-]+)="([^"]*)"/g)) {
      const camel = key.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      button.dataset[camel] = value;
    }
    return button;
  });
  document.querySelectorAll = () => launchers;
  const window = { location: { hash }, addEventListener: (name, fn) => windowEvents.set(name, fn) };
  vm.runInNewContext(script, { document, window });
  return { elements, launchers, document, documentEvents, window, windowEvents, region, target, modal, bodyClasses };
}

for (const hash of ["", "#missing", "#%E0%A4%A", "#[invalid-selector"]) {
  assert.doesNotThrow(() => setup(hash));
}
for (const hash of ["#knp-signature", "#knp%2Dsignature", "#nagpur-projects"]) {
  const app = setup(hash);
  assert.equal(app.region.open, true);
}
const app = setup();
app.window.location.hash = "#knp-signature";
app.windowEvents.get("hashchange")();
assert.equal(app.region.open, true);
assert.equal(app.target.scrolled, true);

const click = (node) => node.listeners.get("click")();
const key = (name, shiftKey = false) => app.documentEvents.get("keydown")({ key: name, shiftKey, preventDefault() {} });
const counter = () => app.elements.get("lightbox-counter").textContent;
const img = app.elements.get("lightbox-image");
const knp = app.launchers.find((node) => node.dataset.galleryTitle === "KNP Signature");
click(knp);
assert.equal(app.modal.hidden, false);
assert.equal(app.bodyClasses.has("lightbox-open"), true);
assert.equal(counter(), "1 / 8");
assert.match(img.src, /projects-knp-dashboard.jpg$/);
key("ArrowLeft");
assert.equal(counter(), "8 / 8");
key("ArrowRight");
assert.equal(counter(), "1 / 8");
for (let index = 2; index <= 8; index++) {
  click(app.elements.get("lightbox-next"));
  assert.equal(counter(), index + " / 8");
  assert.ok(img.alt);
}
key("Tab");
assert.equal(app.document.activeElement, app.elements.get("lightbox-prev"));
key("Tab", true);
assert.equal(app.document.activeElement, app.elements.get("close"));
key("Escape");
assert.equal(app.modal.hidden, true);
assert.equal(app.document.activeElement, knp);
assert.equal(app.bodyClasses.has("lightbox-open"), false);
for (const launcher of app.launchers) {
  click(launcher);
  assert.equal(counter(), "1 / " + launcher.dataset.images.split("|").length);
  click(app.elements.get("close"));
  assert.equal(app.document.activeElement, launcher);
}
console.log("PASS: project anchors, malformed hashes, all galleries, eight KNP views, wraparound, keyboard controls, and focus restoration.");
