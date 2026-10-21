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

    // Si está en estado de Endospora latente, se ve como un quiste mineralizado oscuro
    if (b.isSpore) {
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.75, 0, Math.PI * 2);
      ctx.fillStyle = `hsl(${hue}, 25%, 30%)`;
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#94a3b8';
      ctx.stroke();
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

    // 1. Halo exterior de Cápsula Mucosa
    if (traits.wall === 'capsule' && !lowDetail) {
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 1.65, r * 1.3, 0, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${hue}, 85%, 65%, 0.22)`;
      ctx.fill();
    }

    // 2. Apéndices Locomotores (solo en nivel de detalle normal)
    if (!lowDetail && !b.isDying) {
      if (traits.motility === 'flagellated') {
        this.drawFlagellum(ctx, r, hue, b.animPhase);
      } else if (traits.motility === 'ciliated') {
        this.drawCilia(ctx, r, hue, b.animPhase);
      } else if (traits.motility === 'spirochete') {
        this.drawAxialFilament(ctx, r, hue, b.animPhase);
      } else if (traits.motility === 'sessile') {
        this.drawBiofilmPili(ctx, r, hue);
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

    ctx.fillStyle = b.isDying ? `hsl(${hue}, 45%, 38%)` : `hsl(${hue}, 75%, 46%)`;
    ctx.fill();

    // 4. Pared Celular
    this.strokeCellWall(ctx, traits.wall, hue, lowDetail, b.isDying);

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

    // 6. Detalle intracelular ligero (vacuolas o vesículas químicas) en alto detalle
    if (!lowDetail) {
      ctx.beginPath();
      ctx.arc(r * 0.2, -r * 0.1, Math.max(1.4, r * 0.24), 0, Math.PI * 2);
      ctx.fillStyle =
        traits.interaction !== 'neutral'
          ? 'rgba(244, 114, 182, 0.85)'
          : `hsla(${(hue + 35) % 360}, 90%, 80%, 0.55)`;
      ctx.fill();

      // Si está dividiéndose, mostrar constricción del septo central
      if (b.dividingProgress > 0.15) {
        ctx.beginPath();
        ctx.moveTo(0, -r * (0.75 - b.dividingProgress * 0.5));
        ctx.lineTo(0, r * (0.75 - b.dividingProgress * 0.5));
        ctx.strokeStyle = `hsla(${hue}, 95%, 82%, 0.8)`;
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }
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
    isDying: boolean
  ): void {
    if (isDying) {
      ctx.setLineDash([3, 3]);
    }
    ctx.lineWidth = wall === 'gram_positive' ? 3.0 : wall === 's_layer' ? 2.2 : 1.3;
    ctx.strokeStyle = `hsl(${hue}, 90%, 24%)`;
    ctx.stroke();

    if (!lowDetail) {
      if (wall === 'gram_negative') {
        ctx.strokeStyle = `hsla(${hue}, 90%, 72%, 0.55)`;
        ctx.lineWidth = 0.9;
        ctx.stroke();
      } else if (wall === 's_layer') {
        ctx.save();
        ctx.setLineDash([2, 2.5]);
        ctx.strokeStyle = `hsla(${(hue + 25) % 360}, 95%, 82%, 0.85)`;
        ctx.lineWidth = 1.4;
        ctx.stroke();
        ctx.restore();
      }
    }
    if (isDying) {
      ctx.setLineDash([]);
    }
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
