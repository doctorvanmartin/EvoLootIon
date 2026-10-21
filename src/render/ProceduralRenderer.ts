import { Bacteria } from '../models/Bacteria';
import { AdaptationType, CellMorphology, MetabolismType, WallType } from '../models/DNA';
import { Nutrient } from '../models/Nutrient';
import { SimConfig } from '../config/SimulationConfig';

export class ProceduralRenderer {
  private static readonly COCCUS_CLUSTER_CENTERS: readonly (readonly [number, number])[] = [
    [-0.45, -0.35],
    [0.15, -0.55],
    [0.55, -0.15],
    [-0.4, 0.35],
    [0.2, 0.35],
  ];

  public static renderNutrient(ctx: CanvasRenderingContext2D, n: Nutrient): void {
    ctx.fillStyle = n.isOrganicCorpse
      ? 'rgba(251, 191, 36, 0.82)'
      : 'rgba(74, 222, 128, 0.75)';
    ctx.beginPath();
    ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  public static renderBacteria(
    ctx: CanvasRenderingContext2D,
    b: Bacteria,
    lowDetail: boolean = false,
    isSelected: boolean = false
  ): void {
    ctx.save();
    ctx.translate(b.x, b.y);

    if (b.isDying) {
      ctx.globalAlpha = Math.max(0.08, 1 - b.dyingProgress * 0.92);
    }

    // Anillo de selección si el usuario está inspeccionando esta bacteria
    if (isSelected) {
      ctx.beginPath();
      ctx.arc(0, 0, b.radius * 2.2, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.9)';
      ctx.lineWidth = 1.6;
      ctx.setLineDash([4, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Destello de daño cuando está siendo atacada o envenenada
    if (b.beingAttackedTimer > 0 && !b.isDying) {
      ctx.beginPath();
      ctx.arc(0, 0, b.radius * 1.65, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(248, 113, 113, 0.78)';
      ctx.lineWidth = 2.0;
      ctx.stroke();
    }

    // Aura de emisión química (Bacteriocinas / Quorum Sensing / Sideróforos)
    if (b.isEmittingToxin && !lowDetail && !b.isDying) {
      const pulse = 0.82 + Math.sin(b.animPhase * 1.6) * 0.18;
      const auraR =
        b.dna.traits.interaction === 'siderophores'
          ? SimConfig.SIDEROPHORE_PULL_RADIUS * pulse * 0.48
          : SimConfig.TOXIN_RADIUS * pulse * 0.55;
      ctx.beginPath();
      ctx.arc(0, 0, auraR, 0, Math.PI * 2);
      ctx.strokeStyle =
        b.dna.traits.interaction === 'siderophores'
          ? 'rgba(56, 189, 248, 0.25)'
          : `hsla(${b.dna.hue}, 90%, 65%, 0.22)`;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    ctx.rotate(b.angle);

    const r = b.radius;
    const hue = b.dna.hue;
    const traits = b.dna.traits;
    const adapt: AdaptationType = traits.adaptation || 'none';

    // Si está en estado de Endospora latente, se ve como un quiste multicapa refractante (exosporio + cubierta + córtex + núcleo)
    if (b.isSpore) {
      this.drawLatentEndospore(ctx, r, hue, lowDetail, b.animPhase);
      ctx.restore();
      return;
    }

    // Si está en Lisis Celular (muriendo), dibujar vesículas de desintegración
    if (b.isDying && !lowDetail) {
      const fragCount = 6;
      for (let i = 0; i < fragCount; i++) {
        const ang = (i / fragCount) * Math.PI * 2 + b.dyingProgress * 1.5;
        const dist = r * (0.7 + b.dyingProgress * 1.1);
        ctx.beginPath();
        ctx.arc(
          Math.cos(ang) * dist,
          Math.sin(ang) * dist,
          Math.max(1.2, r * 0.22 * (1 - b.dyingProgress * 0.5)),
          0,
          Math.PI * 2
        );
        ctx.fillStyle = `hsla(${hue}, 65%, 55%, 0.65)`;
        ctx.fill();
      }
    }

    // Halo de Bioluminiscencia si posee ese atributo único
    if (adapt === 'bioluminescence' && !lowDetail) {
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.95, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${(hue + 40) % 360}, 95%, 68%, 0.18)`;
      ctx.fill();
    }

    // 1. Halo exterior de Cápsula Mucosa (glicocálix hidratado con borde difuso)
    if (traits.wall === 'capsule' && !lowDetail) {
      this.drawCapsuleHalo(ctx, r, hue, b.animPhase);
    }

    // 2. Apéndices Locomotores (solo en nivel de detalle alto)
    if (!lowDetail && !b.isDying) {
      if (traits.motility === 'flagellated') {
        this.drawFlagellum(ctx, r, hue, b.animPhase, traits.metabolism, b.dna.referenceSpecies?.morphology);
      } else if (traits.motility === 'ciliated') {
        this.drawCilia(ctx, r, hue, b.animPhase, traits.metabolism, b.dna.referenceSpecies?.morphology);
      } else if (traits.motility === 'spirochete') {
        this.drawAxialFilament(ctx, r, hue, b.animPhase);
      } else if (traits.motility === 'sessile') {
        this.drawBiofilmPili(ctx, r, hue, b.animPhase);
      }

      if (traits.reproduction === 'conjugation') {
        this.drawSexPilus(ctx, r, hue, b.animPhase);
      }
    }

    // 3. Soma celular según Metabolismo (con soporte para Mitosis / División gradual)
    ctx.beginPath();
    if (b.dividingProgress > 0) {
      const sep = b.dividingProgress * r * 0.78;
      const lobeR = r * (0.92 - b.dividingProgress * 0.14);
      const childR = traits.reproduction === 'budding' ? lobeR * 0.72 : lobeR;
      ctx.arc(-sep, 0, childR, 0, Math.PI * 2);
      ctx.arc(sep, 0, lobeR, 0, Math.PI * 2);
    } else {
      this.traceSomaPath(ctx, traits.metabolism, r, b.dna.referenceSpecies?.morphology);
    }

    ctx.fillStyle = b.isDying ? `hsl(${hue}, 45%, 38%)` : `hsl(${hue}, 74%, 44%)`;
    ctx.fill();

    // Sombreado volumétrico interno y ultraestructura intracelular en alto detalle
    if (!lowDetail) {
      ctx.save();
      ctx.clip();
      this.drawIntracellularUltrastructure(ctx, b, r, hue);
      ctx.restore();

      // Re-trazar el contorno del soma para que strokeCellWall pinte sobre el borde limpio
      ctx.beginPath();
      if (b.dividingProgress > 0) {
        const sep = b.dividingProgress * r * 0.78;
        const lobeR = r * (0.92 - b.dividingProgress * 0.14);
        const childR = traits.reproduction === 'budding' ? lobeR * 0.72 : lobeR;
        ctx.arc(-sep, 0, childR, 0, Math.PI * 2);
        ctx.arc(sep, 0, lobeR, 0, Math.PI * 2);
      } else {
        this.traceSomaPath(ctx, traits.metabolism, r, b.dna.referenceSpecies?.morphology);
      }
    }

    // 4. Pared Celular
    this.strokeCellWall(ctx, traits.wall, hue, lowDetail, b.isDying, b.dna.stats.armor);

    // 5. Atributos Únicos (Pinzas, Gran Boca, Pinchos, Bioluminiscencia, Ventosa)
    if (!lowDetail && adapt !== 'none') {
      this.drawUniqueAdaptation(
        ctx,
        adapt,
        traits.metabolism,
        r,
        hue,
        b.animPhase,
        b.isAttackingTimer > 0
      );
    }

    // 6. Anillo contráctil FtsZ durante citocinesis en alto detalle
    if (!lowDetail && b.dividingProgress > 0.12) {
      const pinchHalfH = r * Math.max(0.18, 0.78 - b.dividingProgress * 0.55);
      const septumX =
        traits.reproduction === 'budding' ? -b.dividingProgress * r * 0.18 : 0;
      ctx.beginPath();
      ctx.moveTo(septumX, -pinchHalfH);
      ctx.lineTo(septumX, pinchHalfH);
      ctx.strokeStyle = `hsla(${hue}, 95%, 84%, 0.88)`;
      ctx.lineWidth = 1.6;
      ctx.stroke();

      ctx.fillStyle = `hsla(${(hue + 35) % 360}, 95%, 88%, 0.9)`;
      ctx.beginPath();
      ctx.arc(septumX, -pinchHalfH, Math.max(1.0, r * 0.11), 0, Math.PI * 2);
      ctx.arc(septumX, pinchHalfH, Math.max(1.0, r * 0.11), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private static traceSomaPath(
    ctx: CanvasRenderingContext2D,
    metabolism: MetabolismType,
    r: number,
    morphology?: CellMorphology
  ): void {
    if (morphology === 'coccus_cluster') {
      for (let i = 0; i < this.COCCUS_CLUSTER_CENTERS.length; i++) {
        const center = this.COCCUS_CLUSTER_CENTERS[i];
        const centerX = center[0] * r;
        const centerY = center[1] * r;
        ctx.moveTo(centerX + r * 0.48, centerY);
        ctx.arc(centerX, centerY, r * 0.48, 0, Math.PI * 2);
      }
    } else if (morphology === 'coccus' || metabolism === 'photosynthetic') {
      ctx.arc(0, 0, r, 0, Math.PI * 2);
    } else if (morphology === 'curved_rod') {
      ctx.moveTo(-r * 1.15, -r * 0.18);
      ctx.quadraticCurveTo(-r * 0.35, -r * 0.72, r * 0.25, -r * 0.18);
      ctx.quadraticCurveTo(r * 0.85, r * 0.38, r * 1.15, r * 0.12);
      ctx.quadraticCurveTo(r * 0.25, r * 0.72, -r * 0.3, r * 0.2);
      ctx.quadraticCurveTo(-r * 0.85, -r * 0.2, -r * 1.15, -r * 0.18);
      ctx.closePath();
    } else if (morphology === 'rod') {
      ctx.ellipse(0, 0, r * 1.3, r * 0.72, 0, 0, Math.PI * 2);
    } else if (metabolism === 'predator') {
      ctx.ellipse(0, 0, r * 1.5, r * 0.7, 0, 0, Math.PI * 2);
    } else if (metabolism === 'fermenter') {
      ctx.arc(-r * 0.42, 0, r * 0.78, 0, Math.PI * 2);
      ctx.arc(r * 0.42, 0, r * 0.78, 0, Math.PI * 2);
    } else if (metabolism === 'chemolithotroph') {
      const sides = 6;
      for (let i = 0; i < sides; i++) {
        const a = (i / sides) * Math.PI * 2;
        const px = Math.cos(a) * (r * 1.22);
        const py = Math.sin(a) * (r * 0.98);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
    } else {
      ctx.ellipse(0, 0, r * 1.3, r * 0.85, 0, 0, Math.PI * 2);
    }
  }

  private static strokeCellWall(
    ctx: CanvasRenderingContext2D,
    wall: WallType,
    hue: number,
    lowDetail: boolean,
    isDying: boolean,
    armor: number = 0
  ): void {
    if (isDying) {
      ctx.setLineDash([3, 3]);
    }
    const baseWidth =
      wall === 'gram_positive'
        ? 3.1 + armor * 0.1
        : wall === 's_layer'
          ? 2.3 + armor * 0.06
          : wall === 'capsule'
            ? 1.8
            : 1.5;
    ctx.lineWidth = baseWidth;
    ctx.strokeStyle = `hsl(${hue}, 88%, 22%)`;
    ctx.stroke();

    if (!lowDetail) {
      if (wall === 'gram_positive') {
        // Borde denso interno de peptidoglicano reticulado con ácidos teicoicos
        ctx.save();
        ctx.strokeStyle = `hsla(${(hue + 14) % 360}, 85%, 64%, 0.55)`;
        ctx.lineWidth = Math.max(1.1, baseWidth * 0.42);
        ctx.stroke();
        ctx.restore();
      } else if (wall === 'gram_negative') {
        // Bicapa lipídica externa translúcida + espacio periplásmico brillante
        ctx.save();
        ctx.strokeStyle = `hsla(${hue}, 95%, 76%, 0.65)`;
        ctx.lineWidth = 0.9;
        ctx.stroke();
        ctx.setLineDash([1.2, 2.8]);
        ctx.strokeStyle = `hsla(${(hue + 30) % 360}, 95%, 85%, 0.6)`;
        ctx.lineWidth = 1.6;
        ctx.stroke();
        ctx.restore();
      } else if (wall === 's_layer') {
        // Subunidades glicoproteicas cristalinas (teselado paracristalino)
        ctx.save();
        ctx.setLineDash([2.0, 2.2]);
        ctx.strokeStyle = `hsla(${(hue + 25) % 360}, 95%, 84%, 0.9)`;
        ctx.lineWidth = 1.55;
        ctx.stroke();
        ctx.restore();
      } else if (wall === 'capsule') {
        ctx.save();
        ctx.strokeStyle = `hsla(${hue}, 90%, 78%, 0.5)`;
        ctx.lineWidth = 0.85;
        ctx.stroke();
        ctx.restore();
      }
    }
    if (isDying) {
      ctx.setLineDash([]);
    }
  }

  /**
   * Dibuja una endospora bacteriana latente con arquitectura concéntrica realista:
   * exosporio laxo, túnica proteica laminada, córtex de peptidoglicano, pared germinal y
   * protoplasto central birrefringente (complejo Ca²⁺-ácido dipicolínico).
   */
  private static drawLatentEndospore(
    ctx: CanvasRenderingContext2D,
    r: number,
    hue: number,
    lowDetail: boolean,
    phase: number
  ): void {
    const rx = r * 0.92;
    const ry = r * 0.68;

    if (lowDetail) {
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      ctx.fillStyle = `hsl(${hue}, 30%, 28%)`;
      ctx.fill();
      ctx.lineWidth = 2.0;
      ctx.strokeStyle = '#cbd5e1';
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(0, 0, rx * 0.48, ry * 0.48, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#e2e8f0';
      ctx.fill();
      return;
    }

    ctx.save();
    // 1. Halo refractivo de microscopía de contraste de fases
    ctx.beginPath();
    ctx.ellipse(0, 0, rx * 1.32, ry * 1.34, 0, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${hue}, 60%, 82%, 0.14)`;
    ctx.fill();

    // 2. Exosporio basal membranoso (velo poligonal/ovalado tenue con apéndices polares)
    ctx.beginPath();
    ctx.ellipse(0, 0, rx * 1.18, ry * 1.16, 0, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${hue}, 32%, 22%, 0.52)`;
    ctx.fill();
    ctx.setLineDash([2.2, 1.8]);
    ctx.lineWidth = 1.0;
    ctx.strokeStyle = `hsla(${hue}, 45%, 70%, 0.55)`;
    ctx.stroke();
    ctx.setLineDash([]);

    // Crestas polares del exosporio
    ctx.beginPath();
    ctx.moveTo(-rx * 1.28, 0);
    ctx.lineTo(-rx * 0.98, 0);
    ctx.moveTo(rx * 0.98, 0);
    ctx.lineTo(rx * 1.28, 0);
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.55)';
    ctx.lineWidth = 1.1;
    ctx.stroke();

    // 3. Túnica proteica externa (Spore Coat) queratinizada y densa
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = `hsl(${hue}, 28%, 20%)`;
    ctx.fill();
    ctx.lineWidth = 2.1;
    ctx.strokeStyle = '#94a3b8';
    ctx.stroke();

    // Estrías concéntricas de la cubierta laminar
    ctx.beginPath();
    ctx.ellipse(0, 0, rx * 0.86, ry * 0.85, 0, 0, Math.PI * 2);
    ctx.lineWidth = 0.9;
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.45)';
    ctx.stroke();

    // 4. Córtex de peptidoglicano modificado (anillo refractante ambarino/azulado)
    ctx.beginPath();
    ctx.ellipse(0, 0, rx * 0.74, ry * 0.72, 0, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${(hue + 20) % 360}, 52%, 44%, 0.88)`;
    ctx.fill();
    ctx.lineWidth = 1.1;
    ctx.strokeStyle = `hsla(${hue}, 70%, 76%, 0.75)`;
    ctx.stroke();

    // 5. Nucleoide y protoplasto deshidratado con dipicolinato de calcio (alta birrefringencia óptica)
    const shimmer = 0.88 + Math.sin(phase * 0.8) * 0.08;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx * 0.48, ry * 0.46, 0, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(241, 245, 249, ${shimmer})`;
    ctx.fill();

    // Cromatina condensada con proteínas SASPs en el centro del core
    ctx.beginPath();
    ctx.moveTo(-rx * 0.24, 0);
    ctx.quadraticCurveTo(0, -ry * 0.18, rx * 0.24, 0);
    ctx.quadraticCurveTo(0, ry * 0.18, -rx * 0.24, 0);
    ctx.strokeStyle = `hsla(${hue}, 80%, 35%, 0.65)`;
    ctx.lineWidth = 1.0;
    ctx.stroke();

    // Destello especular vítreo de microscopía de contraste de fases
    ctx.beginPath();
    ctx.ellipse(-rx * 0.18, -ry * 0.16, rx * 0.2, ry * 0.13, -0.35, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.fill();

    ctx.restore();
  }

  /**
   * Dibuja una pre-espora (endospora en maduración dentro del esporangio materno)
   * para bacterias con estrategia reproductiva de esporulación.
   */
  private static drawForesporeBody(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    r: number,
    hue: number
  ): void {
    const sx = Math.max(2.1, r * 0.34);
    const sy = Math.max(1.6, r * 0.25);

    ctx.save();
    // Tabique asimétrico de esporulación / membrana de engullimiento
    ctx.beginPath();
    ctx.ellipse(cx, cy, sx * 1.25, sy * 1.25, 0, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${hue}, 50%, 22%, 0.55)`;
    ctx.fill();
    ctx.lineWidth = 0.85;
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.78)';
    ctx.stroke();

    // Córtex de dipicolinato cálcico
    ctx.beginPath();
    ctx.ellipse(cx, cy, sx * 0.92, sy * 0.9, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(203, 213, 225, 0.88)';
    ctx.fill();
    ctx.lineWidth = 0.8;
    ctx.strokeStyle = `hsla(${hue}, 75%, 32%, 0.8)`;
    ctx.stroke();

    // Core birrefringente brillante
    ctx.beginPath();
    ctx.ellipse(cx - sx * 0.14, cy - sy * 0.14, sx * 0.45, sy * 0.42, -0.25, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fill();
    ctx.restore();
  }

  /**
   * Renderiza la ultraestructura intracelular (citoplasma periférico, nucleoide fibrilar,
   * orgánulos metabólicos especializados, ribosomas, gránulos de reserva y pre-espora).
   * Se ejecuta dentro del clip del soma celular en nivel de detalle alto.
   */
  private static drawIntracellularUltrastructure(
    ctx: CanvasRenderingContext2D,
    b: Bacteria,
    r: number,
    hue: number
  ): void {
    const traits = b.dna.traits;
    const morphology = b.dna.referenceSpecies?.morphology;
    const energyRatio = Math.max(0.1, Math.min(1.2, b.energy / b.dna.stats.splitEnergy));

    // 1. Ectoplasma claro e iluminación cenital sub-membrana (efecto contraste de fases / DIC)
    ctx.beginPath();
    ctx.ellipse(-r * 0.08, -r * 0.22, r * 0.95, r * 0.48, -0.1, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${(hue + 15) % 360}, 88%, 72%, 0.22)`;
    ctx.fill();

    // Sombra basal citoplasmática para dar volumen 3D al soma
    ctx.beginPath();
    ctx.ellipse(r * 0.08, r * 0.36, r * 1.05, r * 0.45, 0, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${hue}, 82%, 18%, 0.26)`;
    ctx.fill();

    if (morphology === 'coccus_cluster') {
      // En estafilococos (racimos de cocos), dibujar tabiques intercelulares y nucleoides individuales
      ctx.strokeStyle = `hsla(${hue}, 85%, 22%, 0.65)`;
      ctx.lineWidth = 0.95;
      for (let i = 0; i < this.COCCUS_CLUSTER_CENTERS.length; i++) {
        const c = this.COCCUS_CLUSTER_CENTERS[i];
        const cx = c[0] * r;
        const cy = c[1] * r;
        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.46, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx - r * 0.07, cy - r * 0.07, r * 0.17, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${(hue + 30) % 360}, 90%, 82%, 0.42)`;
        ctx.fill();
      }
      return;
    }

    // 2. Nucleoide bacteriano (ADN genómico condensado en lazos superenrollados sin membrana nuclear)
    const isSpherical = morphology === 'coccus' || traits.metabolism === 'photosynthetic';
    ctx.save();
    ctx.strokeStyle = `hsla(${(hue + 32) % 360}, 92%, 82%, 0.42)`;
    ctx.lineWidth = Math.max(0.85, r * 0.11);
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (isSpherical) {
      ctx.arc(0, 0, r * 0.36, 0.2, Math.PI * 1.65);
      ctx.moveTo(-r * 0.22, -r * 0.12);
      ctx.quadraticCurveTo(r * 0.08, r * 0.22, r * 0.26, -r * 0.08);
    } else {
      const spanX = r * 0.56;
      ctx.moveTo(-spanX, -r * 0.08);
      ctx.bezierCurveTo(-spanX * 0.35, -r * 0.34, spanX * 0.35, r * 0.34, spanX, -r * 0.06);
      ctx.moveTo(-spanX * 0.85, r * 0.12);
      ctx.bezierCurveTo(-spanX * 0.25, r * 0.32, spanX * 0.25, -r * 0.3, spanX * 0.85, r * 0.1);
    }
    ctx.stroke();
    ctx.restore();

    // 3. Ultraestructura específica según el tipo metabólico
    if (traits.metabolism === 'photosynthetic') {
      // Lamelas tilacoidales concéntricas ricas en clorofila y ficobilisomas
      ctx.save();
      ctx.strokeStyle = 'rgba(74, 222, 128, 0.55)';
      ctx.lineWidth = Math.max(0.8, r * 0.09);
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.72, -Math.PI * 0.82, Math.PI * 0.18);
      ctx.moveTo(
        Math.cos(Math.PI * 0.35) * r * 0.54,
        Math.sin(Math.PI * 0.35) * r * 0.54
      );
      ctx.arc(0, 0, r * 0.54, Math.PI * 0.35, Math.PI * 1.28);
      ctx.stroke();
      ctx.restore();
    } else if (traits.metabolism === 'chemolithotroph') {
      // Carboxisomas poliédricos e inclusiones de azufre/hierro refractantes
      ctx.save();
      ctx.fillStyle = 'rgba(253, 224, 71, 0.65)';
      ctx.strokeStyle = 'rgba(161, 98, 7, 0.7)';
      ctx.lineWidth = 0.7;
      for (let i = -1; i <= 1; i += 2) {
        const cx = i * r * 0.38;
        const cy = i * r * 0.12;
        const cr = Math.max(1.2, r * 0.18);
        ctx.beginPath();
        for (let k = 0; k < 6; k++) {
          const ang = (k / 6) * Math.PI * 2;
          const vx = cx + Math.cos(ang) * cr;
          const vy = cy + Math.sin(ang) * cr;
          if (k === 0) ctx.moveTo(vx, vy);
          else ctx.lineTo(vx, vy);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    } else if (traits.metabolism === 'fermenter') {
      // Vesículas de gas / fermentación y tabique diplocócico central
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.58);
      ctx.lineTo(0, r * 0.58);
      ctx.strokeStyle = `hsla(${hue}, 85%, 22%, 0.55)`;
      ctx.lineWidth = 1.1;
      ctx.stroke();

      ctx.fillStyle = 'rgba(254, 240, 138, 0.6)';
      ctx.beginPath();
      ctx.arc(-r * 0.45, -r * 0.15, Math.max(1.1, r * 0.16), 0, Math.PI * 2);
      ctx.arc(r * 0.42, r * 0.14, Math.max(1.0, r * 0.14), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (traits.metabolism === 'predator') {
      // Vacuolas digestivas fagolisosómicas con enzimas líticas
      ctx.save();
      ctx.fillStyle = 'rgba(251, 113, 133, 0.65)';
      ctx.beginPath();
      ctx.arc(-r * 0.25, r * 0.12, Math.max(1.3, r * 0.2), 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 228, 230, 0.6)';
      ctx.lineWidth = 0.6;
      ctx.stroke();
      ctx.restore();
    } else if (traits.metabolism === 'saprophyte') {
      // Lisosomas / vesículas de exoenzimas hidrolíticas
      ctx.save();
      ctx.fillStyle = 'rgba(251, 191, 36, 0.65)';
      ctx.beginPath();
      ctx.arc(-r * 0.32, -r * 0.16, Math.max(1.1, r * 0.15), 0, Math.PI * 2);
      ctx.arc(r * 0.05, r * 0.22, Math.max(1.0, r * 0.14), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 4. Vesículas secretoras de guerra química o gránulo de reserva de polihidroxialcanoato (PHA)
    const vacuoleR = Math.max(1.3, r * (0.16 + energyRatio * 0.08));
    ctx.beginPath();
    ctx.arc(r * 0.34, -r * 0.12, vacuoleR, 0, Math.PI * 2);
    if (traits.interaction === 'siderophores') {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.88)';
    } else if (traits.interaction !== 'neutral') {
      ctx.fillStyle = 'rgba(244, 114, 182, 0.88)';
    } else {
      ctx.fillStyle = `hsla(${(hue + 38) % 360}, 92%, 82%, 0.65)`;
    }
    ctx.fill();

    // Plásmido episomal circular si posee conjugación
    if (traits.reproduction === 'conjugation') {
      ctx.beginPath();
      ctx.arc(r * 0.48, r * 0.16, Math.max(1.1, r * 0.15), 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.85)';
      ctx.lineWidth = 0.9;
      ctx.stroke();
    }

    // 5. Pre-espora polar refringente si la bacteria posee el gen de esporulación
    if (traits.reproduction === 'sporulation') {
      const sporeX = isSpherical ? -r * 0.32 : -r * 0.56;
      this.drawForesporeBody(ctx, sporeX, 0, r, hue);
    }

    // 6. Punteado ribosomal 70S y gránulos de volutina en el citosol
    ctx.fillStyle = `hsla(${(hue + 20) % 360}, 95%, 92%, 0.55)`;
    ctx.beginPath();
    ctx.arc(-r * 0.12, -r * 0.24, 0.75, 0, Math.PI * 2);
    ctx.arc(r * 0.18, r * 0.22, 0.75, 0, Math.PI * 2);
    ctx.arc(r * 0.52, -r * 0.04, 0.7, 0, Math.PI * 2);
    ctx.fill();
  }

  private static drawCapsuleHalo(
    ctx: CanvasRenderingContext2D,
    r: number,
    hue: number,
    phase: number
  ): void {
    const breath = 1 + Math.sin(phase * 0.9) * 0.03;
    ctx.save();
    // Capa mucosa exterior de exopolisacáridos
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.72 * breath, r * 1.34 * breath, 0, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${hue}, 85%, 65%, 0.18)`;
    ctx.fill();
    ctx.setLineDash([3, 2.5]);
    ctx.strokeStyle = `hsla(${hue}, 92%, 78%, 0.38)`;
    ctx.lineWidth = 0.85;
    ctx.stroke();

    // Capa densa interna del glicocálix
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.46, r * 1.12, 0, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${hue}, 88%, 70%, 0.14)`;
    ctx.fill();
    ctx.restore();
  }

  private static drawUniqueAdaptation(
    ctx: CanvasRenderingContext2D,
    adapt: AdaptationType,
    metabolism: MetabolismType,
    r: number,
    hue: number,
    phase: number,
    isAttacking: boolean
  ): void {
    const frontX =
      metabolism === 'photosynthetic'
        ? r * 0.95
        : metabolism === 'predator'
          ? r * 1.45
          : r * 1.25;

    if (adapt === 'claws') {
      const pinch = isAttacking
        ? Math.abs(Math.sin(phase * 4)) * 0.18
        : 0.22 + Math.sin(phase * 1.8) * 0.12;
      ctx.save();
      ctx.strokeStyle = '#fde68a';
      ctx.fillStyle = `hsl(${(hue + 25) % 360}, 85%, 62%)`;
      ctx.lineWidth = 1.8;
      ctx.lineCap = 'round';

      for (const sign of [-1, 1]) {
        ctx.save();
        ctx.translate(frontX * 0.88, sign * r * 0.36);
        ctx.rotate(sign * pinch);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(r * 0.55, sign * r * 0.32, r * 0.78, -sign * r * 0.08);
        ctx.quadraticCurveTo(r * 0.42, sign * r * 0.05, 0, 0);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
    } else if (adapt === 'giant_maw') {
      const openFactor = 0.28 + Math.abs(Math.sin(phase * 2.0)) * 0.25;
      ctx.save();
      ctx.beginPath();
      ctx.arc(frontX * 0.82, 0, r * 0.48, -openFactor * Math.PI, openFactor * Math.PI);
      ctx.lineTo(frontX * 0.45, 0);
      ctx.closePath();
      ctx.fillStyle = '#090d16';
      ctx.fill();
      ctx.strokeStyle = '#fda4af';
      ctx.lineWidth = 1.4;
      ctx.stroke();

      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(frontX * 0.92, -r * 0.22, Math.max(1.1, r * 0.12), 0, Math.PI * 2);
      ctx.arc(frontX * 0.92, r * 0.22, Math.max(1.1, r * 0.12), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (adapt === 'spikes') {
      ctx.save();
      ctx.fillStyle = '#e2e8f0';
      ctx.strokeStyle = `hsl(${hue}, 65%, 30%)`;
      ctx.lineWidth = 0.8;
      const spikeCount = 8;
      const rx = metabolism === 'photosynthetic' ? r : r * 1.3;
      const ry = metabolism === 'photosynthetic' ? r : r * 0.85;
      for (let i = 0; i < spikeCount; i++) {
        const a = (i / spikeCount) * Math.PI * 2;
        const bx = Math.cos(a) * rx;
        const by = Math.sin(a) * ry;
        const tipX = Math.cos(a) * (rx + r * 0.42);
        const tipY = Math.sin(a) * (ry + r * 0.42);
        const perpX = -Math.sin(a) * (r * 0.16);
        const perpY = Math.cos(a) * (r * 0.16);
        ctx.beginPath();
        ctx.moveTo(bx + perpX, by + perpY);
        ctx.lineTo(tipX, tipY);
        ctx.lineTo(bx - perpX, by - perpY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    } else if (adapt === 'bioluminescence') {
      const glow = 0.65 + Math.sin(phase * 2.5) * 0.3;
      ctx.save();
      ctx.fillStyle = `rgba(167, 243, 208, ${glow})`;
      ctx.beginPath();
      ctx.arc(-r * 0.32, -r * 0.18, Math.max(1.5, r * 0.2), 0, Math.PI * 2);
      ctx.arc(-r * 0.1, r * 0.24, Math.max(1.3, r * 0.17), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (adapt === 'suction_pore') {
      const ext = r * (0.45 + Math.sin(phase * 2.1) * 0.15);
      ctx.save();
      ctx.strokeStyle = `hsl(${hue}, 85%, 70%)`;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(frontX * 0.9, 0);
      ctx.lineTo(frontX * 0.9 + ext, 0);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(frontX * 0.9 + ext, 0, Math.max(1.8, r * 0.22), 0, Math.PI * 2);
      ctx.fillStyle = '#38bdf8';
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  /**
   * Renderizado de alta definición para el visor de Microscopio Electrónico del Editor Genómico.
   */
  public static renderMicroscopePreview(
    ctx: CanvasRenderingContext2D,
    b: Bacteria,
    width: number,
    height: number,
    zoomMultiplier = 1
  ): void {
    ctx.save();
    ctx.clearRect(0, 0, width, height);

    const bgGrad = ctx.createRadialGradient(
      width * 0.5,
      height * 0.5,
      10,
      width * 0.5,
      height * 0.5,
      Math.max(width, height) * 0.65
    );
    bgGrad.addColorStop(0, '#0b1526');
    bgGrad.addColorStop(1, '#050811');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    const gridSize = zoomMultiplier > 1.2 ? 14 : 24;
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.55)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = gridSize; x < width; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = gridSize; y < height; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();

    ctx.strokeStyle = 'rgba(16, 185, 129, 0.14)';
    ctx.beginPath();
    ctx.moveTo(width * 0.5 - 12, height * 0.5);
    ctx.lineTo(width * 0.5 + 12, height * 0.5);
    ctx.moveTo(width * 0.5, height * 0.5 - 12);
    ctx.lineTo(width * 0.5, height * 0.5 + 12);
    ctx.stroke();

    const cx = width * 0.52;
    const cy = height * 0.5;
    const scale = Math.min(width / 270, height / 120) * 2.45 * zoomMultiplier;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);

    const floatY = Math.sin(b.animPhase * 0.45) * 1.4;
    ctx.translate(0, floatY);
    ctx.rotate(b.angle);

    const r = b.radius;
    const hue = b.dna.hue;
    const traits = b.dna.traits;
    const adapt: AdaptationType = traits.adaptation || 'none';

    if (traits.interaction !== 'neutral') {
      const pulse = 0.9 + Math.sin(b.animPhase * 1.4) * 0.1;
      const auraRadius = r * 2.35 * pulse;
      const auraGrad = ctx.createRadialGradient(0, 0, r * 0.8, 0, 0, auraRadius);
      auraGrad.addColorStop(
        0,
        traits.interaction === 'siderophores'
          ? 'rgba(56, 189, 248, 0.22)'
          : `hsla(${hue}, 95%, 60%, 0.18)`
      );
      auraGrad.addColorStop(0.7, 'rgba(244, 114, 182, 0.08)');
      auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(0, 0, auraRadius, 0, Math.PI * 2);
      ctx.fill();

      if (traits.interaction === 'quorum_sensing' || traits.interaction === 'siderophores') {
        ctx.save();
        ctx.strokeStyle =
          traits.interaction === 'siderophores'
            ? 'rgba(56, 189, 248, 0.35)'
            : `hsla(${hue}, 90%, 65%, 0.28)`;
        ctx.lineWidth = 0.7;
        ctx.setLineDash([2.5, 2.5]);
        ctx.beginPath();
        ctx.arc(0, 0, r * 2.1 * pulse, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }

    if (adapt === 'bioluminescence') {
      const bioGrad = ctx.createRadialGradient(0, 0, r * 0.5, 0, 0, r * 2.2);
      bioGrad.addColorStop(0, 'rgba(167, 243, 208, 0.28)');
      bioGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = bioGrad;
      ctx.beginPath();
      ctx.arc(0, 0, r * 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    if (traits.wall === 'capsule') {
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 1.85, r * 1.38, 0, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${hue}, 85%, 62%, 0.2)`;
      ctx.fill();
      ctx.strokeStyle = `hsla(${hue}, 90%, 75%, 0.35)`;
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }

    if (traits.motility === 'flagellated') {
      ctx.save();
      ctx.beginPath();
      const startX = traits.metabolism === 'photosynthetic' ? -r * 0.95 : -r * 1.35;
      ctx.moveTo(startX, 0);
      const segments = 6;
      const segLength = 5.8 + b.dna.getEffectiveMaxSpeed() * 0.95;
      for (let i = 1; i <= segments; i++) {
        const segX = startX - i * segLength;
        const segY = Math.sin(b.animPhase * 1.35 - i * 1.05) * (2.2 + i * 0.85);
        ctx.lineTo(segX, segY);
      }
      ctx.strokeStyle = `hsla(${hue}, 72%, 62%, 0.85)`;
      ctx.lineWidth = 2.1;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.restore();
    } else if (traits.motility === 'ciliated') {
      this.drawCilia(ctx, r, hue, b.animPhase * 1.2);
    } else if (traits.motility === 'spirochete') {
      this.drawAxialFilament(ctx, r * 1.1, hue, b.animPhase * 1.2);
    } else if (traits.motility === 'sessile') {
      this.drawBiofilmPili(ctx, r, hue);
    }

    if (traits.reproduction === 'conjugation') {
      this.drawSexPilus(ctx, r * 1.08, hue, b.animPhase);
    }

    ctx.beginPath();
    this.traceSomaPath(
      ctx,
      traits.metabolism,
      r * 1.08,
      b.dna.referenceSpecies?.morphology
    );

    const wallThickness =
      traits.wall === 'gram_positive'
        ? 4.0 + b.dna.stats.armor * 0.16
        : traits.wall === 's_layer'
          ? 3.2
          : traits.wall === 'gram_negative'
            ? 2.4
            : 2.8;

    ctx.fillStyle = `hsl(${hue}, 78%, 50%)`;
    ctx.fill();
    ctx.lineWidth = wallThickness;
    ctx.strokeStyle = `hsl(${hue}, 78%, 26%)`;
    ctx.stroke();

    if (traits.wall === 'gram_negative') {
      ctx.strokeStyle = `hsla(${hue}, 95%, 76%, 0.7)`;
      ctx.lineWidth = 1.0;
      ctx.stroke();
    } else if (traits.wall === 's_layer') {
      ctx.save();
      ctx.setLineDash([2.2, 2.2]);
      ctx.strokeStyle = `hsla(${(hue + 25) % 360}, 95%, 85%, 0.9)`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }

    if (adapt !== 'none') {
      this.drawUniqueAdaptation(ctx, adapt, traits.metabolism, r * 1.08, hue, b.animPhase, false);
    }

    ctx.beginPath();
    ctx.ellipse(
      r * 0.18,
      -r * 0.04,
      Math.max(1.8, r * 0.28),
      Math.max(1.3, r * 0.2),
      0,
      0,
      Math.PI * 2
    );
    ctx.fillStyle =
      traits.interaction !== 'neutral'
        ? '#f472b6'
        : `hsla(${(hue + 40) % 360}, 90%, 78%, 0.75)`;
    ctx.fill();

    if (traits.reproduction === 'sporulation') {
      ctx.beginPath();
      ctx.arc(-r * 0.45, 0, Math.max(1.5, r * 0.24), 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(226, 232, 240, 0.8)';
      ctx.fill();
    }

    ctx.restore();
    ctx.restore();
  }

  private static drawFlagellum(
    ctx: CanvasRenderingContext2D,
    r: number,
    hue: number,
    phase: number
  ): void {
    ctx.beginPath();
    ctx.moveTo(-r * 1.2, 0);
    for (let i = 1; i <= 4; i++) {
      const segX = -r * 1.2 - i * 5.5;
      const segY = Math.sin(phase + i * 1.3) * (3 + i * 0.9);
      ctx.lineTo(segX, segY);
    }
    ctx.strokeStyle = `hsla(${hue}, 70%, 60%, 0.65)`;
    ctx.lineWidth = 1.6;
    ctx.stroke();
  }

  private static drawCilia(
    ctx: CanvasRenderingContext2D,
    r: number,
    hue: number,
    phase: number
  ): void {
    ctx.strokeStyle = `hsla(${hue}, 70%, 65%, 0.55)`;
    ctx.lineWidth = 1.1;
    const count = 12;
    ctx.beginPath();
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const sx = Math.cos(a) * (r * 1.2);
      const sy = Math.sin(a) * (r * 0.85);
      const wave = Math.sin(phase + i) * 0.3;
      const ex = Math.cos(a + wave) * (r * 1.2 + 3.5);
      const ey = Math.sin(a + wave) * (r * 0.85 + 3.5);
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
    }
    ctx.stroke();
  }

  private static drawAxialFilament(
    ctx: CanvasRenderingContext2D,
    r: number,
    hue: number,
    phase: number
  ): void {
    ctx.save();
    ctx.strokeStyle = `hsla(${(hue + 30) % 360}, 90%, 75%, 0.75)`;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    const steps = 10;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = -r * 1.35 + t * (r * 2.7);
      const y = Math.sin(phase * 1.8 + t * Math.PI * 3) * (r * 0.72);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  private static drawSexPilus(
    ctx: CanvasRenderingContext2D,
    r: number,
    hue: number,
    phase: number
  ): void {
    ctx.save();
    ctx.strokeStyle = `hsla(${(hue + 60) % 360}, 85%, 72%, 0.7)`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.85);
    ctx.quadraticCurveTo(
      r * 0.4,
      -r * 1.65,
      r * 0.9 + Math.sin(phase) * 2,
      -r * 1.45
    );
    ctx.stroke();
    ctx.restore();
  }

  private static drawBiofilmPili(
    ctx: CanvasRenderingContext2D,
    r: number,
    hue: number
  ): void {
    ctx.fillStyle = `hsla(${hue}, 65%, 55%, 0.14)`;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.55, 0, Math.PI * 2);
    ctx.fill();
  }
}
