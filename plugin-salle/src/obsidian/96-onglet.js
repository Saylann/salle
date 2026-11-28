// SallePlugin, l'onglet du plugin dans les réglages d'Obsidian (Settings → Salle).

Object.assign(SallePlugin.prototype, {
  // ── L'onglet du plugin dans les réglages d'Obsidian ──
  // Les réglages du plugin dans ceux d'Obsidian (Settings → Salle) : le même test, le minuteur de l'iPhone, le son, la
  // vibration, le lien. Les mêmes valeurs que l'onglet Appli des réglages de la vue (reglages.chronoIphone, son, vibration).
  ongletReglages() {
    if (typeof obsidian.PluginSettingTab !== 'function' || typeof obsidian.Setting !== 'function' || typeof this.addSettingTab !== 'function') return;
    const plugin = this;
    class OngletSalle extends obsidian.PluginSettingTab {
      display() {
        const el = this.containerEl;
        while (el.firstChild) el.removeChild(el.firstChild);
        const reg = plugin.donnees.reglages;
        new obsidian.Setting(el).setName('Tester cet appareil').setDesc('Écran allumé, bip, vibration, liens : le plugin garde ce qui marche.')
          .addButton((b) => b.setButtonText('Ouvrir le test').onClick(() => { try { this.app.setting.close(); } catch (e) { /* rien */ } plugin.ouvrirEcran('diagnostic'); }));
        if (!reg) {
          new obsidian.Setting(el).setName('Premières questions').setDesc('Ouvre la salle et réponds aux questions : les réglages viennent ensuite.');
          return;
        }
        new obsidian.Setting(el).setName(`Minuteur de l'iPhone (« ${RACCOURCI} »)`).setDesc('Après chaque série, le minuteur de l\'iPhone : il sonne même écran verrouillé.')
          .addToggle((t) => t.setValue(!!reg.chronoIphone).onChange(async (v) => { reg.chronoIphone = !!v; await plugin.sauver(); }));
        new obsidian.Setting(el).setName('Bip à la fin du repos').setDesc('Seulement quand Obsidian est à l\'écran.')
          .addToggle((t) => t.setValue(reg.son !== false).onChange(async (v) => { reg.son = v; await plugin.sauver(); }));
        new obsidian.Setting(el).setName('Vibration à « Série faite »').setDesc('iPhone avec iOS 18 ou plus récent.')
          .addToggle((t) => t.setValue(reg.vibration !== false).onChange(async (v) => { reg.vibration = v; await plugin.sauver(); }));
        const lien = L.lienSalle(plugin.nomCoffre(), 'seance');
        new obsidian.Setting(el).setName('Lien de la séance').setDesc(lien)
          .addButton((b) => b.setButtonText('Copier').onClick(() => plugin.copier(lien, 'Lien copié.')));
      }
    }
    this.addSettingTab(new OngletSalle(this.app, this));
  },
});
