import { Bacteria } from '../models/Bacteria';
import { AdaptationType, CellMorphology, MetabolismType, WallType } from '../models/DNA';
import { Bacteriophage, Neutrophil } from '../models/HostAgents';
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

  public static renderNutrient(
    ctx: CanvasRenderingContext2D,
    n: Nutrient,
    lowDetail: boolean = false
  ): void {
    if (lowDetail) {
      ctx.fillStyle = n.isOrganicCorpse
        ? `hsla(${n.hue}, 55%, 52%, 0.78)`
        : `hsla(${n.hue}, 78%, 62%, 0.75)`;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    ctx.save();
    ctx.translate(n.x, n.y);
    ctx.rotate(n.angle);

    const r = n.radius;
    const h = n.hue;

    if (n.isOrganicCorpse) {
      // Detritus celular lisado (cadáver orgánico): fantasma de membrana roto,
      // vesículas lipídicas dispersas y hebras de cromatina / péptidos coagulados
      const rx = r * 1.18;
      const ry = r * n.aspect;

      // Halo turbio de lisis citoplasmática
      ctx.beginPath();
      ctx.ellipse(0, 0, rx * 1.25, ry * 1.25, 0, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${h}, 45%, 38%, 0.22)`;
      ctx.fill();

      // Membrana colapsada e irregular (fantasma celular roto)
      ctx.beginPath();
      ctx.moveTo(-rx * 0.95, -ry * 0.25);
      ctx.quadraticCurveTo(-rx * 0.35, -ry * 1.05, rx * 0.45, -ry * 0.72);
      ctx.quadraticCurveTo(rx * 1.08, -ry * 0.1, rx * 0.78, ry * 0.65);
      ctx.quadraticCurveTo(rx * 0.1, ry * 1.05, -rx * 0.68, ry * 0.72);
      ctx.quadraticCurveTo(-rx * 1.1, ry * 0.2, -rx * 0.95, -ry * 0.25);
      ctx.closePath();
      ctx.fillStyle = `hsla(${h}, 38%, 32%, 0.68)`;
      ctx.fill();

      ctx.setLineDash([2.2, 1.8]);
      ctx.lineWidth = 1.0;
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.72)';
      ctx.stroke();
      ctx.setLineDash([]);

      // Gránulos proteicos / lipídicos coagulados en el interior del cadáver
      ctx.fillStyle = 'rgba(251, 191, 36, 0.85)';
      ctx.beginPath();
      ctx.arc(-rx * 0.28, -ry * 0.12, Math.max(1.1, r * 0.28), 0, Math.PI * 2);
      ctx.arc(rx * 0.32, ry * 0.18, Math.max(0.95, r * 0.22), 0, Math.PI * 2);
      ctx.fill();

      // Vesícula apoptótica desprendida y hebra de nucleoide liberada
      ctx.fillStyle = `hsla(${h}, 55%, 58%, 0.75)`;
      ctx.beginPath();
      ctx.arc(rx * 0.92, -ry * 0.55, Math.max(0.85, r * 0.19), 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(-rx * 0.45, ry * 0.15);
      ctx.quadraticCurveTo(0, -ry * 0.35, rx * 0.42, ry * 0.05);
      ctx.strokeStyle = 'rgba(253, 230, 138, 0.65)';
      ctx.lineWidth = 0.75;
      ctx.stroke();

      ctx.restore();
      return;
    }

    // Sustrato nutritivo: morfologías variadas (cristales minerales, glúcidos, agregados peptídicos)
    if (n.shape === 'hex_crystal') {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const px = Math.cos(a) * (r * 1.15);
        const py = Math.sin(a) * (r * 0.95);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = `hsla(${h}, 80%, 54%, 0.78)`;
      ctx.fill();
      ctx.lineWidth = 0.75;
      ctx.strokeStyle = `hsla(${h}, 92%, 82%, 0.85)`;
      ctx.stroke();

      // Faceta interna cristalina
      ctx.beginPath();
      ctx.moveTo(-r * 0.55, -r * 0.3);
      ctx.lineTo(r * 0.55, -r * 0.3);
      ctx.lineTo(0, r * 0.55);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.32)';
      ctx.fill();
    } else if (n.shape === 'rhomboid') {
      const rx = r * 1.32;
      const ry = r * 0.82;
      ctx.beginPath();
      ctx.moveTo(0, -ry);
      ctx.lineTo(rx, 0);
      ctx.lineTo(0, ry);
      ctx.lineTo(-rx, 0);
      ctx.closePath();
      ctx.fillStyle = `hsla(${h + 15}, 82%, 56%, 0.8)`;
      ctx.fill();
      ctx.lineWidth = 0.7;
      ctx.strokeStyle = 'rgba(209, 250, 229, 0.8)';
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-rx * 0.65, 0);
      ctx.lineTo(rx * 0.65, 0);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 0.65;
      ctx.stroke();
    } else if (n.shape === 'amino_cluster') {
      // Tríada molecular / agregado de aminoácidos
      const subR = r * 0.64;
      ctx.fillStyle = `hsla(${h - 10}, 78%, 55%, 0.82)`;
      ctx.strokeStyle = `hsla(${h}, 90%, 82%, 0.7)`;
      ctx.lineWidth = 0.6;
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2;
        const cx = Math.cos(a) * (r * 0.52);
        const cy = Math.sin(a) * (r * 0.52);
        ctx.beginPath();
        ctx.arc(cx, cy, subR, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    } else if (n.shape === 'mineral_shard') {
      // Esquirla mineral asimétrica con arista refractante
      ctx.beginPath();
      ctx.moveTo(-r * 1.15, -r * 0.35);
      ctx.lineTo(r * 0.25, -r * 1.05);
      ctx.lineTo(r * 1.2, -r * 0.1);
      ctx.lineTo(r * 0.55, r * 0.95);
      ctx.lineTo(-r * 0.85, r * 0.72);
      ctx.closePath();
      ctx.fillStyle = `hsla(${h + 22}, 75%, 52%, 0.8)`;
      ctx.fill();
      ctx.lineWidth = 0.75;
      ctx.strokeStyle = `hsla(${h + 28}, 95%, 84%, 0.85)`;
      ctx.stroke();
    } else {
      // Gránulo polisacárido / gota de glucosa hidratada con brillo lenticular
      const rx = r * 1.12;
      const ry = r * n.aspect;
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${h}, 82%, 54%, 0.78)`;
      ctx.fill();
      ctx.lineWidth = 0.7;
      ctx.strokeStyle = `hsla(${h}, 90%, 80%, 0.75)`;
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(-rx * 0.28, -ry * 0.25, rx * 0.35, ry * 0.24, -0.3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.fill();
    }

    ctx.restore();
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
      ctx.arc(0, 0, b.radius * 1.55, 0, Math.PI * 2);
      ctx.strokeStyle =
        b.combatHitType === 'toxin'
          ? 'rgba(244, 114, 182, 0.75)'
          : 'rgba(248, 113, 113, 0.78)';
      ctx.lineWidth = lowDetail ? 1.5 : 1.9;
      ctx.stroke();
    }

    // Flujo de fagocitosis / absorción de biomasa cuando una predadora está devorando a una presa
    if (!lowDetail && b.isAttackingTimer > 0 && !b.isDying) {
      this.drawPredatorFeedingStream(ctx, b);
    }

    // Halo de infección vírica activa (ciclo lítico de bacteriófago en curso)
    if (b.isInfectedByPhage && !b.isDying) {
      const prog = b.phageInfectionProgress;
      const pulseSpeed = 4.2 + prog * 10.0;
      const pulse = 0.88 + Math.sin(b.animPhase * pulseSpeed) * (0.12 + prog * 0.08);
      ctx.beginPath();
      ctx.arc(0, 0, b.radius * (1.48 + prog * 0.22) * pulse, 0, Math.PI * 2);
      ctx.strokeStyle =
        prog > 0.72
          ? `rgba(244, 114, 182, ${0.55 + prog * 0.4})`
          : `rgba(192, 132, 252, ${0.45 + prog * 0.45})`;
      ctx.lineWidth = lowDetail ? 1.4 : 1.85;
      ctx.setLineDash([2.5, 2.5]);
      ctx.stroke();
      ctx.setLineDash([]);
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

    // Temblor agónico por infección vírica o sacudida por mordisco / pinchazo en combate bacteriano
    if (b.isInfectedByPhage && !b.isDying) {
      const tremorAmp = (0.4 + b.phageInfectionProgress * 1.85) * (lowDetail ? 0.5 : 1.0);
      const jx = Math.sin(b.animPhase * 28.0 + b.id * 1.3) * tremorAmp;
      const jy = Math.cos(b.animPhase * 33.0 + b.id * 2.1) * tremorAmp;
      ctx.translate(jx, jy);
    } else if (
      b.beingAttackedTimer > 0 &&
      !b.isDying &&
      (b.combatHitType === 'bite' || b.combatHitType === 'spikes')
    ) {
      const hitShake = (b.beingAttackedTimer / 0.34) * (lowDetail ? 0.6 : 1.35);
      const jx = Math.sin(b.animPhase * 34.0 + b.id) * hitShake;
      const jy = Math.cos(b.animPhase * 39.0 + b.id) * hitShake;
      ctx.translate(jx, jy);
    }

    // Impulso de embestida frontal cuando la predadora está mordiendo
    if (b.isAttackingTimer > 0 && !b.isDying) {
      const lunge = Math.sin(b.animPhase * 24.0) * 1.4;
      ctx.translate(Math.cos(b.angle) * lunge, Math.sin(b.angle) * lunge);
    }

    ctx.rotate(b.angle);

    // En la fase final del ciclo lítico (70% -> 100%), el soma se hincha y deforma antes de reventar
    if (b.isInfectedByPhage && !b.isDying && b.phageInfectionProgress > 0.5) {
      const bloatT = (b.phageInfectionProgress - 0.5) / 0.5;
      const pulseX = 1 + bloatT * 0.18 + Math.sin(b.animPhase * 19.0) * bloatT * 0.06;
      const pulseY = 1 + bloatT * 0.22 - Math.sin(b.animPhase * 19.0) * bloatT * 0.06;
      ctx.scale(pulseX, pulseY);
    }

    const r = b.radius;
    const hue = b.dna.hue;
    const traits = b.dna.traits;
    const adapts = b.dna.getAdaptations();

    // Si está en estado de Endospora latente, se ve como un quiste multicapa refractante (exosporio + cubierta + córtex + núcleo)
    if (b.isSpore) {
      this.drawLatentEndospore(ctx, r, hue, lowDetail, b.animPhase);
      ctx.restore();
      return;
    }

    // Si está en Lisis Celular (muriendo), dibujar vesículas de desintegración (y onda de choque si estalló por fagos)
    if (b.isDying && !lowDetail) {
      if (b.diedFromPhageLysis) {
        const dp = b.dyingProgress;
        // Onda expansiva violeta/magenta de rotura por holinas y endolisinas
        ctx.beginPath();
        ctx.arc(0, 0, r * (0.9 + dp * 2.6), 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(216, 180, 254, ${Math.max(0, (1 - dp) * 0.85)})`;
        ctx.lineWidth = Math.max(0.8, 2.6 * (1 - dp));
        ctx.stroke();

        // Estelas radiales de eyección lítica y fragmentos de membrana reventada
        const burstRays = 8;
        ctx.beginPath();
        for (let i = 0; i < burstRays; i++) {
          const rayAng = (i / burstRays) * Math.PI * 2 + 0.2;
          const rIn = r * (0.4 + dp * 0.9);
          const rOut = r * (0.95 + dp * 2.3);
          ctx.moveTo(Math.cos(rayAng) * rIn, Math.sin(rayAng) * rIn);
          ctx.lineTo(Math.cos(rayAng) * rOut, Math.sin(rayAng) * rOut);
        }
        ctx.strokeStyle = `rgba(192, 132, 252, ${Math.max(0, (1 - dp) * 0.75)})`;
        ctx.lineWidth = 1.3;
        ctx.stroke();
      }

      const fragCount = b.diedFromPhageLysis ? 9 : 6;
      const spreadFactor = b.diedFromPhageLysis ? 1.85 : 1.1;
      for (let i = 0; i < fragCount; i++) {
        const ang = (i / fragCount) * Math.PI * 2 + b.dyingProgress * 1.5;
        const dist = r * (0.7 + b.dyingProgress * spreadFactor);
        ctx.beginPath();
        ctx.arc(
          Math.cos(ang) * dist,
          Math.sin(ang) * dist,
          Math.max(1.2, r * 0.22 * (1 - b.dyingProgress * 0.5)),
          0,
          Math.PI * 2
        );
        ctx.fillStyle =
          b.diedFromPhageLysis && i % 2 === 0
            ? `rgba(192, 132, 252, ${Math.max(0.15, 0.78 - b.dyingProgress * 0.6)})`
            : `hsla(${hue}, 65%, 55%, 0.65)`;
        ctx.fill();
      }
    }

    // Halo de Bioluminiscencia si posee ese atributo
    if (b.dna.hasAdaptation('bioluminescence') && !lowDetail) {
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
        this.drawCilia(
          ctx,
          r,
          hue,
          b.animPhase,
          traits.metabolism,
          b.dna.referenceSpecies?.morphology,
          traits.wall,
          b.dna.stats.armor,
          b.dividingProgress
        );
      } else if (traits.motility === 'spirochete') {
        this.drawAxialFilament(
          ctx,
          r,
          hue,
          b.animPhase,
          traits.metabolism,
          b.dna.referenceSpecies?.morphology,
          traits.wall,
          b.dna.stats.armor,
          b.dividingProgress,
          'back'
        );
      } else if (traits.motility === 'sessile') {
        this.drawBiofilmPili(
          ctx,
          r,
          hue,
          b.animPhase,
          traits.metabolism,
          b.dna.referenceSpecies?.morphology,
          traits.wall,
          b.dna.stats.armor,
          b.dividingProgress
        );
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

    // 4b. Tramo periplásmico frontal y nodos subpolares del filamento axial (Espiroqueta)
    if (!lowDetail && !b.isDying && traits.motility === 'spirochete') {
      this.drawAxialFilament(
        ctx,
        r,
        hue,
        b.animPhase,
        traits.metabolism,
        b.dna.referenceSpecies?.morphology,
        traits.wall,
        b.dna.stats.armor,
        b.dividingProgress,
        'front'
      );
    }

    // 5. Atributos Especiales (Pinzas, Gran Boca, Pinchos, Bioluminiscencia, Ventosa — soportando multi-adaptación)
    if (!lowDetail && adapts.length > 0) {
      for (let i = 0; i < adapts.length; i++) {
        this.drawUniqueAdaptation(
          ctx,
          adapts[i],
          traits.metabolism,
          r,
          hue,
          b.animPhase,
          b.isAttackingTimer > 0
        );
      }
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

    // 7. Escudo de rechazo / rebote en la cubierta celular cuando la bacteria bloquea la adsorción de un fago
    if (!lowDetail && b.phageDefenseTimer > 0 && !b.isDying) {
      this.drawPhageDefenseShield(ctx, b, r);
    }

    // 7b. Victoria inmunitaria intracelular (CRISPR-Cas / enzimas de restricción): onda esmeralda y eyección de la carcasa vacía del fago
    if (b.phageCuredTimer > 0 && !b.isDying) {
      this.drawPhageCrisprCureEffect(ctx, b, r, lowDetail);
    }

    // 8. Bacteriófago T4 anclado en el exterior de la membrana inyectando su ADN y lucha celular
    if (b.isInfectedByPhage && !b.isDying) {
      this.drawAdsorbedPhageAttack(ctx, b, r, lowDetail);
    }

    // 9. Combate directo entre bacterias: mordiscos, chispazos de coraza/pinchos, escudo químico y evasión
    if (!lowDetail && !b.isDying && (b.beingAttackedTimer > 0 || b.combatDefenseTimer > 0)) {
      this.drawBacterialCombatEffects(ctx, b, r);
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

  private static getSomaHalfWidth(
    metabolism: MetabolismType,
    r: number,
    morphology?: CellMorphology,
    dividingProgress: number = 0
  ): number {
    if (dividingProgress > 0) {
      const sep = dividingProgress * r * 0.78;
      const lobeR = r * (0.92 - dividingProgress * 0.14);
      return sep + lobeR;
    }
    if (morphology === 'coccus_cluster') return r * 1.03;
    if (morphology === 'coccus' || metabolism === 'photosynthetic') return r;
    if (morphology === 'curved_rod') return r * 1.15;
    if (morphology === 'rod') return r * 1.3;
    if (metabolism === 'predator') return r * 1.5;
    if (metabolism === 'fermenter') return r * 1.2;
    if (metabolism === 'chemolithotroph') return r * 1.22;
    return r * 1.3;
  }

  private static getSomaHalfHeight(
    metabolism: MetabolismType,
    r: number,
    morphology?: CellMorphology,
    dividingProgress: number = 0
  ): number {
    if (dividingProgress > 0) {
      return r * (0.92 - dividingProgress * 0.14);
    }
    if (morphology === 'coccus_cluster') return r * 0.95;
    if (morphology === 'coccus' || metabolism === 'photosynthetic') return r;
    if (morphology === 'curved_rod') return r * 0.72;
    if (morphology === 'rod') return r * 0.72;
    if (metabolism === 'predator') return r * 0.7;
    if (metabolism === 'fermenter') return r * 0.78;
    if (metabolism === 'chemolithotroph') return r * 0.98;
    return r * 0.85;
  }

  private static getWallBaseWidth(wall: WallType, armor: number = 0): number {
    return wall === 'gram_positive'
      ? 3.1 + armor * 0.1
      : wall === 's_layer'
        ? 2.3 + armor * 0.06
        : wall === 'capsule'
          ? 1.8
          : 1.5;
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
    const baseWidth = this.getWallBaseWidth(wall, armor);
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

    // 7. Ensamblaje intracelular de cápsides icosaédricas y lucha genómica durante el ciclo lítico de un bacteriófago
    if (b.isInfectedByPhage) {
      const prog = Math.min(1, Math.max(0.05, b.phageInfectionProgress));
      ctx.save();

      // Chorro de ADN vírico inyectado desde el punto de adsorción en la membrana hacia el nucleoide
      const halfW = this.getSomaHalfWidth(
        traits.metabolism,
        r,
        morphology,
        b.dividingProgress
      );
      const halfH = this.getSomaHalfHeight(
        traits.metabolism,
        r,
        morphology,
        b.dividingProgress
      );
      const hitAng = b.phageAdsorptionAngle;
      const entryX = Math.cos(hitAng) * halfW * 0.92;
      const entryY = Math.sin(hitAng) * halfH * 0.92;
      const injectReach = Math.min(1, prog * 2.2);

      // Filamento zigzagueante de genoma vírico invadiendo el citoplasma
      ctx.beginPath();
      ctx.moveTo(entryX, entryY);
      const midX =
        entryX * (1 - injectReach * 0.55) +
        Math.sin(b.animPhase * 9.0) * r * 0.18;
      const midY =
        entryY * (1 - injectReach * 0.55) +
        Math.cos(b.animPhase * 9.0) * r * 0.18;
      const tipX = entryX * (1 - injectReach * 0.95);
      const tipY = entryY * (1 - injectReach * 0.95);
      ctx.quadraticCurveTo(midX, midY, tipX, tipY);
      ctx.strokeStyle = `rgba(56, 189, 248, ${0.85 - prog * 0.35})`;
      ctx.lineWidth = Math.max(1.0, r * 0.12);
      ctx.stroke();

      // Vórtice de secuestro ribosomal en el centro celular
      ctx.beginPath();
      ctx.arc(
        0,
        0,
        r * (0.22 + prog * 0.36),
        b.animPhase * 3.2,
        b.animPhase * 3.2 + Math.PI * 1.35
      );
      ctx.strokeStyle = `rgba(192, 132, 252, ${0.35 + prog * 0.45})`;
      ctx.lineWidth = Math.max(0.9, r * 0.1);
      ctx.stroke();

      // 2ª Línea de Defensa (CRISPR-Cas / Enzimas de Restricción): arcos y tijeras moleculares
      // dorado-esmeralda atacando el ADN vírico inyectado
      if (b.phageCrisprProgress > 0.04) {
        const cp = Math.min(1, b.phageCrisprProgress);
        const casRadius = r * (0.28 + cp * 0.32);
        const casAngle = -b.animPhase * 6.5;

        // Anillo enzimático contra-rotatorio de endonucleasas Cas
        ctx.beginPath();
        ctx.arc(0, 0, casRadius, casAngle, casAngle + Math.PI * (0.75 + cp * 0.75));
        ctx.strokeStyle = `rgba(52, 211, 153, ${0.55 + cp * 0.4})`;
        ctx.lineWidth = Math.max(1.1, r * 0.12);
        ctx.stroke();

        // Destellos de corte ("tijeras moleculares") sobre el filamento de ADN invasor
        const cutX =
          entryX * (1 - injectReach * 0.5) +
          Math.cos(b.animPhase * 16.0) * r * 0.12;
        const cutY =
          entryY * (1 - injectReach * 0.5) +
          Math.sin(b.animPhase * 16.0) * r * 0.12;
        const slashLen = Math.max(1.8, r * (0.22 + cp * 0.15));
        const slashAng = b.animPhase * 12.0;
        ctx.beginPath();
        ctx.moveTo(
          cutX - Math.cos(slashAng) * slashLen,
          cutY - Math.sin(slashAng) * slashLen
        );
        ctx.lineTo(
          cutX + Math.cos(slashAng) * slashLen,
          cutY + Math.sin(slashAng) * slashLen
        );
        ctx.moveTo(
          cutX - Math.cos(slashAng + 1.1) * slashLen,
          cutY - Math.sin(slashAng + 1.1) * slashLen
        );
        ctx.lineTo(
          cutX + Math.cos(slashAng + 1.1) * slashLen,
          cutY + Math.sin(slashAng + 1.1) * slashLen
        );
        ctx.strokeStyle = `rgba(250, 204, 21, ${0.7 + cp * 0.3})`;
        ctx.lineWidth = 1.15;
        ctx.stroke();
      }

      // Cápsides hijas ensamblándose y agitándose dentro del citoplasma antes de reventar la pared
      const virionCount = prog > 0.72 ? 4 : prog > 0.45 ? 3 : prog > 0.2 ? 2 : 1;
      ctx.fillStyle = `rgba(168, 85, 247, ${0.7 + prog * 0.28})`;
      ctx.strokeStyle = 'rgba(243, 232, 255, 0.95)';
      ctx.lineWidth = 0.75;
      for (let i = 0; i < virionCount; i++) {
        const ang =
          b.animPhase * (1.4 + prog * 2.2) + (i * Math.PI * 2) / virionCount;
        const dist =
          r * (0.18 + prog * 0.34) +
          Math.sin(b.animPhase * 8.0 + i * 2.1) * r * 0.08 * prog;
        const vx = Math.cos(ang) * dist;
        const vy = Math.sin(ang) * dist;
        const cr = Math.max(1.3, r * (0.15 + prog * 0.06));
        ctx.beginPath();
        for (let k = 0; k < 6; k++) {
          const ha = (k / 6) * Math.PI * 2 + ang;
          const px = vx + Math.cos(ha) * cr;
          const py = vy + Math.sin(ha) * cr;
          if (k === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      // Grietas internas de presión lítica cuando está a punto de estallar (> 70%)
      if (prog > 0.7) {
        const crackAlpha = ((prog - 0.7) / 0.3) * 0.85;
        ctx.strokeStyle = `rgba(244, 114, 182, ${crackAlpha})`;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        for (let c = 0; c < 4; c++) {
          const ca = (c / 4) * Math.PI * 2 + b.animPhase * 0.5;
          ctx.moveTo(Math.cos(ca) * r * 0.3, Math.sin(ca) * r * 0.3);
          ctx.lineTo(Math.cos(ca) * halfW * 0.98, Math.sin(ca) * halfH * 0.98);
        }
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  /**
   * Dibuja un arco de repulsión defensiva sobre la envoltura celular cuando la pared
   * (Capa S, Cápsula o peptidoglicano grueso) bloquea la adsorción de un bacteriófago.
   */
  private static drawPhageDefenseShield(
    ctx: CanvasRenderingContext2D,
    b: Bacteria,
    r: number
  ): void {
    const t = Math.min(1, b.phageDefenseTimer / 0.45);
    const halfW = this.getSomaHalfWidth(
      b.dna.traits.metabolism,
      r,
      b.dna.referenceSpecies?.morphology,
      b.dividingProgress
    );
    const halfH = this.getSomaHalfHeight(
      b.dna.traits.metabolism,
      r,
      b.dna.referenceSpecies?.morphology,
      b.dividingProgress
    );
    const ang = b.phageDefenseAngle;
    const shieldDist = Math.hypot(
      Math.cos(ang) * halfW,
      Math.sin(ang) * halfH
    ) + 2.5 + (1 - t) * 4.5;

    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, shieldDist, ang - 0.65, ang + 0.65);
    ctx.strokeStyle = `rgba(56, 189, 248, ${t * 0.92})`;
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // Chispas de rebote del virión rechazado
    const sx = Math.cos(ang) * shieldDist;
    const sy = Math.sin(ang) * shieldDist;
    ctx.beginPath();
    ctx.arc(sx, sy, 2.2 * t, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(224, 242, 254, ${t * 0.95})`;
    ctx.fill();
    ctx.restore();
  }

  /**
   * Dibuja la victoria inmunitaria de 2ª línea (CRISPR-Cas / Enzimas de restricción):
   * un pulso esmeralda-dorado limpia el citoplasma y la carcasa proteica vacía del
   * bacteriófago sale despedida y girando lejos de la pared celular.
   */
  private static drawPhageCrisprCureEffect(
    ctx: CanvasRenderingContext2D,
    b: Bacteria,
    r: number,
    lowDetail: boolean
  ): void {
    const t = Math.min(1, b.phageCuredTimer / 0.85); // 1 -> 0 a medida que termina la animación
    const elapsed = 1 - t;

    // 1. Halo de purga inmunitaria CRISPR-Cas alrededor de la bacteria
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, r * (1.05 + elapsed * 0.95), 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(52, 211, 153, ${t * 0.9})`;
    ctx.lineWidth = lowDetail ? 1.5 : 2.1;
    ctx.stroke();

    if (lowDetail) {
      ctx.restore();
      return;
    }

    // 2. Carcasa vacía del bacteriófago ("fantasma proteico") saliendo despedida y dando vueltas
    const halfW = this.getSomaHalfWidth(
      b.dna.traits.metabolism,
      r,
      b.dna.referenceSpecies?.morphology,
      b.dividingProgress
    );
    const halfH = this.getSomaHalfHeight(
      b.dna.traits.metabolism,
      r,
      b.dna.referenceSpecies?.morphology,
      b.dividingProgress
    );
    const ang = b.phageAdsorptionAngle;
    const pr = SimConfig.PHAGE_RADIUS;
    const ejectDist = elapsed * (r * 1.45 + 14);
    const ex = Math.cos(ang) * (halfW + ejectDist);
    const ey = Math.sin(ang) * (halfH + ejectDist);

    ctx.translate(ex, ey);
    ctx.rotate(ang + Math.PI * 0.5 + elapsed * 5.2);
    ctx.globalAlpha = t * 0.9;

    // Vaina encogida y cápside vacía desactivada
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.9)';
    ctx.fillStyle = 'rgba(71, 85, 105, 0.35)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.rect(-pr * 0.3, -pr * 0.75, pr * 0.6, pr * 0.75);
    ctx.fill();
    ctx.stroke();

    const headY = -pr * 1.55;
    const hx = pr * 0.88;
    const hy = pr * 0.95;
    ctx.beginPath();
    ctx.moveTo(0, headY - hy);
    ctx.lineTo(hx, headY - hy * 0.42);
    ctx.lineTo(hx, headY + hy * 0.42);
    ctx.lineTo(0, headY + hy * 0.85);
    ctx.lineTo(-hx, headY + hy * 0.42);
    ctx.lineTo(-hx, headY - hy * 0.42);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Renderiza el bacteriófago T4 anclado en el exterior de la pared bacteriana durante todo
   * el ciclo lítico: muestra el agarre de sus fibras caudales, la contracción de la vaina,
   * la aguja perforando la membrana para inyectar el ADN (vaciando la cápside progresivamente)
   * y los chispazos de lucha en el punto de perforación.
   */
  private static drawAdsorbedPhageAttack(
    ctx: CanvasRenderingContext2D,
    b: Bacteria,
    r: number,
    lowDetail: boolean
  ): void {
    const prog = Math.min(1, Math.max(0, b.phageInfectionProgress));
    const halfW = this.getSomaHalfWidth(
      b.dna.traits.metabolism,
      r,
      b.dna.referenceSpecies?.morphology,
      b.dividingProgress
    );
    const halfH = this.getSomaHalfHeight(
      b.dna.traits.metabolism,
      r,
      b.dna.referenceSpecies?.morphology,
      b.dividingProgress
    );
    const ang = b.phageAdsorptionAngle;
    const wallX = Math.cos(ang) * halfW;
    const wallY = Math.sin(ang) * halfH;
    const pr = SimConfig.PHAGE_RADIUS;

    if (lowDetail) {
      // En vista alejada, mostrar el virión anclado en el borde y un destello pulsante en el punto de ataque
      const px = wallX + Math.cos(ang) * pr * 1.1;
      const py = wallY + Math.sin(ang) * pr * 1.1;
      ctx.fillStyle = 'rgba(192, 132, 252, 0.95)';
      ctx.beginPath();
      ctx.arc(px, py, pr * 1.05, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    ctx.save();
    ctx.translate(wallX, wallY);
    // Orientar el eje +Y local del fago apuntando hacia el interior de la bacteria (-ang)
    ctx.rotate(ang + Math.PI * 0.5);

    // Oscilación de forcejeo entre el fago anclado y la sacudida de la membrana bacteriana
    const struggleWobble =
      Math.sin(b.animPhase * 22.0) * 0.14 * (1 - prog * 0.4);
    ctx.rotate(struggleWobble);

    // Contracción de la vaina caudal durante la primera fase de inyección (0 -> 35% del ciclo)
    const injectionCompression = Math.min(1, prog / 0.35);
    const sheathLen = pr * (1.15 - injectionCompression * 0.42);
    const baseY = 0; // En contacto directo con la pared celular

    // 1. Anillo de perforación / herida en la membrana con chispazos de lucha bioquímica
    const woundPulse = 0.7 + Math.sin(b.animPhase * 25.0) * 0.3;
    ctx.beginPath();
    ctx.ellipse(0, 0, pr * 0.85 * woundPulse, pr * 0.38, 0, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(56, 189, 248, ${0.55 + (1 - prog) * 0.35})`;
    ctx.fill();

    // 2. Aguja del tubo caudal perforando hacia el interior celular (+Y) e inyectando ADN
    const needleDepth = pr * (0.45 + injectionCompression * 0.85);
    ctx.beginPath();
    ctx.moveTo(0, -sheathLen * 0.5);
    ctx.lineTo(0, needleDepth);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.35;
    ctx.stroke();

    // Pulsos luminosos de ADN bajando por el canal caudal
    if (prog < 0.75) {
      const pulseY = -sheathLen + ((b.animPhase * 3.8) % 1) * (sheathLen + needleDepth);
      ctx.beginPath();
      ctx.arc(0, pulseY, 1.3, 0, Math.PI * 2);
      ctx.fillStyle = '#e0f2fe';
      ctx.fill();
    }

    // 3. Fibras caudales (6 patas clavadas con fuerza en la pared bacteriana)
    ctx.strokeStyle = 'rgba(216, 180, 254, 0.95)';
    ctx.lineWidth = 0.9;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    for (const side of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        const gripSpread = 0.65 + i * 0.38;
        const kneeX = side * pr * (0.72 + i * 0.24);
        const kneeY = -pr * (0.35 + (1 - injectionCompression) * 0.25 - i * 0.06);
        const tipX = side * pr * gripSpread;
        const tipY = pr * (0.12 + i * 0.08);
        ctx.moveTo(side * pr * 0.24, baseY - pr * 0.08);
        ctx.lineTo(kneeX, kneeY);
        ctx.lineTo(tipX, tipY);
      }
    }
    ctx.stroke();

    // 4. Vaina helicoidal contraída con anillos transversales de compresión
    ctx.fillStyle = 'rgba(147, 51, 234, 0.95)';
    ctx.strokeStyle = 'rgba(233, 213, 255, 0.95)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.rect(-pr * 0.34, -sheathLen, pr * 0.68, sheathLen);
    ctx.fill();
    ctx.stroke();

    // Placa basal hexagonal anclada a los receptores de membrana
    ctx.beginPath();
    ctx.moveTo(-pr * 0.56, baseY);
    ctx.lineTo(pr * 0.56, baseY);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.25;
    ctx.stroke();

    // 5. Cápside icosaédrica exterior (se vacía de ADN luminiscente a medida que lo inyecta en la bacteria)
    const headY = -sheathLen - pr * 0.88;
    const hx = pr * 0.94;
    const hy = pr * 1.05;
    ctx.beginPath();
    ctx.moveTo(0, headY - hy);
    ctx.lineTo(hx, headY - hy * 0.42);
    ctx.lineTo(hx, headY + hy * 0.42);
    ctx.lineTo(0, headY + hy * 0.85);
    ctx.lineTo(-hx, headY + hy * 0.42);
    ctx.lineTo(-hx, headY - hy * 0.42);
    ctx.closePath();

    // Al vaciarse el genoma vírico hacia el citoplasma, la cápside pasa de violeta brillante a carcasa translúcida
    const capsidFillAlpha = Math.max(0.28, 0.92 - prog * 0.62);
    ctx.fillStyle = `rgba(126, 34, 206, ${capsidFillAlpha})`;
    ctx.fill();
    ctx.lineWidth = 0.95;
    ctx.strokeStyle = 'rgba(233, 213, 255, 0.95)';
    ctx.stroke();

    // Brillo del ADN remanente dentro de la cabeza del fago (disminuye con prog)
    if (prog < 0.85) {
      const dnaLeft = Math.max(0, 1 - prog * 1.2);
      ctx.beginPath();
      ctx.arc(0, headY + hy * 0.15 * (1 - dnaLeft), pr * 0.48 * dnaLeft, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(56, 189, 248, ${0.75 * dnaLeft})`;
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * Dibuja en coordenadas relativas al centro de la bacteria predadora el chorro de
   * fagocitosis (vesículas de biomasa del color de la presa y arco de desgarro)
   * fluyendo desde la presa hacia el polo frontal del depredador.
   */
  private static drawPredatorFeedingStream(
    ctx: CanvasRenderingContext2D,
    predator: Bacteria
  ): void {
    const dx = predator.combatTargetX - predator.x;
    const dy = predator.combatTargetY - predator.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 1 || dist > predator.radius * 4.5) return;

    const dirX = dx / dist;
    const dirY = dy / dist;
    const mouthDist = predator.radius * 1.15;
    const mouthX = Math.cos(predator.angle) * mouthDist;
    const mouthY = Math.sin(predator.angle) * mouthDist;
    const contactX = dirX * Math.min(dist * 0.72, predator.radius * 1.65);
    const contactY = dirY * Math.min(dist * 0.72, predator.radius * 1.65);

    ctx.save();
    // 1. Filamento lítico de succión / desgarro entre la presa y las fauces
    ctx.beginPath();
    ctx.moveTo(contactX, contactY);
    ctx.lineTo(mouthX, mouthY);
    ctx.strokeStyle = `hsla(${predator.combatTargetHue}, 92%, 68%, 0.75)`;
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // 2. Tres corpúsculos de citoplasma arrancados viajando hacia la boca del depredador
    for (let i = 0; i < 3; i++) {
      const flowT = ((predator.animPhase * 4.5 + i * 0.33) % 1);
      const px = contactX + (mouthX - contactX) * flowT;
      const py = contactY + (mouthY - contactY) * flowT;
      const dropR = Math.max(1.1, predator.radius * 0.16 * (1 - flowT * 0.35));
      ctx.beginPath();
      ctx.arc(px, py, dropR, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${predator.combatTargetHue}, 95%, 72%, 0.92)`;
      ctx.fill();
    }

    // 3. Destello de mordisco en el punto de contacto
    const slashAng = predator.animPhase * 16.0;
    const slashLen = Math.max(2.4, predator.radius * 0.36);
    ctx.beginPath();
    ctx.moveTo(
      contactX - Math.cos(slashAng) * slashLen,
      contactY - Math.sin(slashAng) * slashLen
    );
    ctx.lineTo(
      contactX + Math.cos(slashAng) * slashLen,
      contactY + Math.sin(slashAng) * slashLen
    );
    ctx.moveTo(
      contactX - Math.cos(slashAng + 1.2) * slashLen,
      contactY - Math.sin(slashAng + 1.2) * slashLen
    );
    ctx.lineTo(
      contactX + Math.cos(slashAng + 1.2) * slashLen,
      contactY + Math.sin(slashAng + 1.2) * slashLen
    );
    ctx.strokeStyle = 'rgba(254, 202, 202, 0.92)';
    ctx.lineWidth = 1.3;
    ctx.stroke();
    ctx.restore();
  }

  /**
   * Renderiza los efectos de lucha cuerpo a cuerpo y defensa en el punto exacto de impacto
   * sobre la bacteria atacada: herida de mordisco, chispas de rebote por coraza/pinchos,
   * estela de evasión por cápsula/espiroqueta y escudo de neutralización química.
   */
  private static drawBacterialCombatEffects(
    ctx: CanvasRenderingContext2D,
    b: Bacteria,
    r: number
  ): void {
    const halfW = this.getSomaHalfWidth(
      b.dna.traits.metabolism,
      r,
      b.dna.referenceSpecies?.morphology,
      b.dividingProgress
    );
    const halfH = this.getSomaHalfHeight(
      b.dna.traits.metabolism,
      r,
      b.dna.referenceSpecies?.morphology,
      b.dividingProgress
    );
    const hitAng = b.combatAttackerAngle;
    const wallX = Math.cos(hitAng) * halfW;
    const wallY = Math.sin(hitAng) * halfH;
    const wallDist = Math.hypot(wallX, wallY);

    ctx.save();

    // A. Efecto en el punto de impacto según el tipo de ataque recibido (mordisco, pinchos o toxina)
    if (b.beingAttackedTimer > 0) {
      const hitAlpha = Math.min(1, b.beingAttackedTimer / 0.34);
      if (b.combatHitType === 'bite') {
        // Muesca / desgarro carmesí en el borde mordido y gotas de lisis saltando
        ctx.beginPath();
        ctx.arc(wallX, wallY, Math.max(2.0, r * 0.28), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(239, 68, 68, ${hitAlpha * 0.78})`;
        ctx.fill();

        for (let i = -1; i <= 1; i++) {
          const spAng = hitAng + i * 0.42 + Math.sin(b.animPhase * 20 + i) * 0.15;
          const spDist = wallDist + 2.5 + ((b.animPhase * 12 + i * 0.3) % 1) * (r * 0.55);
          ctx.beginPath();
          ctx.arc(
            Math.cos(spAng) * spDist,
            Math.sin(spAng) * spDist,
            Math.max(0.9, r * 0.11),
            0,
            Math.PI * 2
          );
          ctx.fillStyle = `hsla(${b.dna.hue}, 90%, 70%, ${hitAlpha * 0.9})`;
          ctx.fill();
        }
      } else if (b.combatHitType === 'spikes') {
        // Destello punzante blanco-ámbar cuando se pincha contra Pinchos Calcáreos o Capa S
        const sparkLen = Math.max(2.6, r * 0.42);
        ctx.strokeStyle = `rgba(253, 224, 71, ${hitAlpha * 0.95})`;
        ctx.lineWidth = 1.45;
        ctx.beginPath();
        for (let i = -1; i <= 1; i++) {
          const sa = hitAng + i * 0.38;
          ctx.moveTo(wallX, wallY);
          ctx.lineTo(
            wallX + Math.cos(sa) * sparkLen,
            wallY + Math.sin(sa) * sparkLen
          );
        }
        ctx.stroke();
      } else if (b.combatHitType === 'toxin') {
        // Burbujeo corrosivo magenta sobre la membrana expuesta a bacteriocinas
        for (let i = 0; i < 3; i++) {
          const ba = hitAng + (i - 1) * 0.65 + Math.sin(b.animPhase * 8 + i) * 0.25;
          const bx = Math.cos(ba) * halfW * 0.96;
          const by = Math.sin(ba) * halfH * 0.96;
          ctx.beginPath();
          ctx.arc(bx, by, Math.max(1.1, r * 0.14), 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(244, 114, 182, ${hitAlpha * 0.85})`;
          ctx.lineWidth = 1.1;
          ctx.stroke();
        }
      }
    }

    // B. Respuesta defensiva visible según los atributos de la bacteria defensora
    if (b.combatDefenseTimer > 0) {
      const defAlpha = Math.min(1, b.combatDefenseTimer / 0.34);
      if (b.combatDefenseType === 'armor_reflect') {
        // Escudo cristalino / espinoso ámbar-acero que refleja el mordisco al atacante
        ctx.beginPath();
        ctx.arc(0, 0, wallDist + 3.0, hitAng - 0.72, hitAng + 0.72);
        ctx.strokeStyle = `rgba(251, 191, 36, ${defAlpha * 0.95})`;
        ctx.lineWidth = 2.3;
        ctx.stroke();
      } else if (b.combatDefenseType === 'capsule_slip') {
        // Estelas hidrodinámicas de glicocálix / espiroqueta escurriéndose del mordisco
        ctx.strokeStyle = `rgba(56, 189, 248, ${defAlpha * 0.85})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, wallDist + 3.8, hitAng + 0.35, hitAng + 1.35);
        ctx.moveTo(
          Math.cos(hitAng - 0.35) * (wallDist + 3.8),
          Math.sin(hitAng - 0.35) * (wallDist + 3.8)
        );
        ctx.arc(0, 0, wallDist + 3.8, hitAng - 0.35, hitAng - 1.35, true);
        ctx.stroke();
      } else if (b.combatDefenseType === 'toxin_shield') {
        // Barrera de neutralización química en el flanco expuesto a las bacteriocinas
        ctx.beginPath();
        ctx.arc(0, 0, wallDist + 2.6, hitAng - 0.85, hitAng + 0.85);
        ctx.strokeStyle = `rgba(52, 211, 153, ${defAlpha * 0.85})`;
        ctx.lineWidth = 1.8;
        ctx.setLineDash([3, 2]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    ctx.restore();
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
    const adapts = b.dna.getAdaptations();

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

    if (b.dna.hasAdaptation('bioluminescence')) {
      const bioGrad = ctx.createRadialGradient(0, 0, r * 0.5, 0, 0, r * 2.2);
      bioGrad.addColorStop(0, 'rgba(167, 243, 208, 0.28)');
      bioGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = bioGrad;
      ctx.beginPath();
      ctx.arc(0, 0, r * 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    if (traits.wall === 'capsule') {
      this.drawCapsuleHalo(ctx, r * 1.08, hue, b.animPhase);
    }

    if (traits.motility === 'flagellated') {
      this.drawFlagellum(
        ctx,
        r * 1.08,
        hue,
        b.animPhase * 1.35,
        traits.metabolism,
        b.dna.referenceSpecies?.morphology,
        true
      );
    } else if (traits.motility === 'ciliated') {
      this.drawCilia(
        ctx,
        r * 1.08,
        hue,
        b.animPhase * 1.2,
        traits.metabolism,
        b.dna.referenceSpecies?.morphology,
        traits.wall,
        b.dna.stats.armor
      );
    } else if (traits.motility === 'spirochete') {
      this.drawAxialFilament(
        ctx,
        r * 1.08,
        hue,
        b.animPhase * 1.2,
        traits.metabolism,
        b.dna.referenceSpecies?.morphology,
        traits.wall,
        b.dna.stats.armor,
        0,
        'back'
      );
    } else if (traits.motility === 'sessile') {
      this.drawBiofilmPili(
        ctx,
        r * 1.08,
        hue,
        b.animPhase,
        traits.metabolism,
        b.dna.referenceSpecies?.morphology,
        traits.wall,
        b.dna.stats.armor
      );
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

    ctx.fillStyle = `hsl(${hue}, 76%, 46%)`;
    ctx.fill();

    // Ultraestructura intracelular recortada al contorno del soma en la vista de microscopio
    ctx.save();
    ctx.clip();
    this.drawIntracellularUltrastructure(ctx, b, r * 1.08, hue);
    ctx.restore();

    ctx.beginPath();
    this.traceSomaPath(
      ctx,
      traits.metabolism,
      r * 1.08,
      b.dna.referenceSpecies?.morphology
    );
    this.strokeCellWall(ctx, traits.wall, hue, false, false, b.dna.stats.armor);

    if (traits.motility === 'spirochete') {
      this.drawAxialFilament(
        ctx,
        r * 1.08,
        hue,
        b.animPhase * 1.2,
        traits.metabolism,
        b.dna.referenceSpecies?.morphology,
        traits.wall,
        b.dna.stats.armor,
        0,
        'front'
      );
    }

    if (adapts.length > 0) {
      for (let i = 0; i < adapts.length; i++) {
        this.drawUniqueAdaptation(
          ctx,
          adapts[i],
          traits.metabolism,
          r * 1.08,
          hue,
          b.animPhase,
          false
        );
      }
    }

    ctx.restore();
    ctx.restore();
  }

  private static drawFlagellum(
    ctx: CanvasRenderingContext2D,
    r: number,
    hue: number,
    phase: number,
    metabolism: MetabolismType = 'chemoheterotroph',
    morphology?: CellMorphology,
    isMicroscope: boolean = false
  ): void {
    const startX =
      morphology === 'coccus' || metabolism === 'photosynthetic'
        ? -r * 0.96
        : metabolism === 'predator'
          ? -r * 1.46
          : -r * 1.26;

    ctx.save();
    // Cuerpo basal flagelar (anillo motor MS/C insertado en el polo posterior)
    ctx.fillStyle = `hsl(${(hue + 25) % 360}, 85%, 72%)`;
    ctx.beginPath();
    ctx.arc(startX, 0, Math.max(1.2, r * 0.16), 0, Math.PI * 2);
    ctx.fill();

    // Filamento helicoidal principal con gancho flagelar y atenuación distal
    const segments = isMicroscope ? 8 : 6;
    const segLen = isMicroscope ? r * 0.62 : r * 0.56;
    ctx.beginPath();
    ctx.moveTo(startX, 0);
    for (let i = 1; i <= segments; i++) {
      const segX = startX - i * segLen;
      const amp = (1.6 + i * 0.72) * (r / 8);
      const segY = Math.sin(phase - i * 1.1) * amp;
      const prevX = startX - (i - 0.5) * segLen;
      const prevY = Math.sin(phase - (i - 0.5) * 1.1) * amp;
      ctx.quadraticCurveTo(prevX, prevY, segX, segY);
    }
    ctx.strokeStyle = `hsla(${hue}, 78%, 68%, 0.82)`;
    ctx.lineWidth = isMicroscope ? 1.9 : 1.55;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Segundo filamento secundario desfasado (penacho lofótrico sutil)
    ctx.beginPath();
    ctx.moveTo(startX, r * 0.12);
    for (let i = 1; i <= segments - 1; i++) {
      const segX = startX - i * (segLen * 0.86);
      const amp = (1.2 + i * 0.58) * (r / 8);
      const segY = r * 0.12 + Math.cos(phase - i * 1.15) * amp;
      ctx.lineTo(segX, segY);
    }
    ctx.strokeStyle = `hsla(${hue}, 70%, 62%, 0.45)`;
    ctx.lineWidth = isMicroscope ? 1.15 : 0.95;
    ctx.stroke();
    ctx.restore();
  }

  private static drawCilia(
    ctx: CanvasRenderingContext2D,
    r: number,
    hue: number,
    phase: number,
    metabolism: MetabolismType = 'chemoheterotroph',
    morphology?: CellMorphology,
    wall: WallType = 'gram_negative',
    armor: number = 0,
    dividingProgress: number = 0
  ): void {
    const wallPad = this.getWallBaseWidth(wall, armor) * 0.45;
    const rx = this.getSomaHalfWidth(metabolism, r, morphology, dividingProgress) * 0.96 + wallPad;
    const ry = this.getSomaHalfHeight(metabolism, r, morphology, dividingProgress) * 0.96 + wallPad;

    ctx.save();
    ctx.strokeStyle = `hsla(${hue}, 78%, 70%, 0.65)`;
    ctx.lineWidth = 1.05;
    ctx.lineCap = 'round';
    const count = 16;
    ctx.beginPath();
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const sx = Math.cos(a) * rx;
      const sy = Math.sin(a) * ry;
      // Onda metacrónica coordinada a lo largo del perímetro celular
      const metachronalWave = Math.sin(phase * 1.6 + i * 0.65) * 0.36;
      const cLen = Math.max(2.8, r * 0.42);
      const midX = sx + Math.cos(a + metachronalWave * 0.5) * (cLen * 0.55);
      const midY = sy + Math.sin(a + metachronalWave * 0.5) * (cLen * 0.55);
      const ex = sx + Math.cos(a + metachronalWave) * cLen;
      const ey = sy + Math.sin(a + metachronalWave) * cLen;
      ctx.moveTo(sx, sy);
      ctx.quadraticCurveTo(midX, midY, ex, ey);
    }
    ctx.stroke();
    ctx.restore();
  }

  private static drawAxialFilament(
    ctx: CanvasRenderingContext2D,
    r: number,
    hue: number,
    phase: number,
    metabolism: MetabolismType = 'chemoheterotroph',
    morphology?: CellMorphology,
    wall: WallType = 'gram_negative',
    armor: number = 0,
    dividingProgress: number = 0,
    layer: 'back' | 'front' = 'front'
  ): void {
    const wallPad = this.getWallBaseWidth(wall, armor) * 0.5;
    const rx = this.getSomaHalfWidth(metabolism, r, morphology, dividingProgress);
    const ry = this.getSomaHalfHeight(metabolism, r, morphology, dividingProgress);

    const poleX = rx + wallPad * 0.65 + Math.max(1.2, r * 0.12);
    const spanX = poleX + Math.max(1.4, r * 0.14);
    const ampY = ry + wallPad * 0.85 + Math.max(2.2, r * 0.24);
    const steps = 16;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (layer === 'back') {
      // Hélice posterior (detrás del soma): sus crestas y giros polares asoman por el contorno exterior
      ctx.strokeStyle = `hsla(${hue}, 85%, 64%, 0.62)`;
      ctx.lineWidth = Math.max(1.15, r * 0.13);
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = -spanX + t * (spanX * 2);
        const env = Math.pow(Math.sin(t * Math.PI), 0.55);
        const y = -Math.sin(phase * 1.8 + t * Math.PI * 3.2) * (ampY * env);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
      return;
    }

    // Capa frontal periplásmica: traza secundaria translúcida sobre el soma para dar lectura de doble hélice
    ctx.strokeStyle = `hsla(${hue}, 88%, 68%, 0.36)`;
    ctx.lineWidth = Math.max(0.95, r * 0.1);
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = -spanX + t * (spanX * 2);
      const env = Math.pow(Math.sin(t * Math.PI), 0.55);
      const y = -Math.sin(phase * 1.8 + t * Math.PI * 3.2) * (ampY * 0.92 * env);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Cinta periplásmica principal torsionada (endoflagelo helicoidal cruzando sobre el soma y la pared)
    ctx.strokeStyle = `hsla(${(hue + 32) % 360}, 95%, 78%, 0.88)`;
    ctx.lineWidth = Math.max(1.35, r * 0.15);
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = -spanX + t * (spanX * 2);
      const env = Math.pow(Math.sin(t * Math.PI), 0.55);
      const y = Math.sin(phase * 1.8 + t * Math.PI * 3.2) * (ampY * env);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Nodos de anclaje subpolar (cuerpos basales de los endoflagelos periplásmicos en ambos polos)
    const nodeR = Math.max(1.35, r * 0.16);
    ctx.fillStyle = `hsla(${(hue + 35) % 360}, 95%, 84%, 0.95)`;
    ctx.strokeStyle = `hsla(${hue}, 90%, 20%, 0.85)`;
    ctx.lineWidth = 0.85;
    ctx.beginPath();
    ctx.arc(-poleX, 0, nodeR, 0, Math.PI * 2);
    ctx.moveTo(poleX + nodeR, 0);
    ctx.arc(poleX, 0, nodeR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  private static drawSexPilus(
    ctx: CanvasRenderingContext2D,
    r: number,
    hue: number,
    phase: number
  ): void {
    const tipX = r * 0.92 + Math.sin(phase * 1.1) * 1.8;
    const tipY = -r * 1.48 + Math.cos(phase * 0.9) * 1.2;

    ctx.save();
    ctx.strokeStyle = `hsla(${(hue + 60) % 360}, 88%, 74%, 0.78)`;
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.78);
    ctx.quadraticCurveTo(r * 0.38, -r * 1.55, tipX, tipY);
    ctx.stroke();

    // Vesícula / adhesina terminal del pilus conjugativo F
    ctx.fillStyle = `hsla(${(hue + 60) % 360}, 95%, 84%, 0.9)`;
    ctx.beginPath();
    ctx.arc(tipX, tipY, Math.max(1.1, r * 0.14), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private static drawBiofilmPili(
    ctx: CanvasRenderingContext2D,
    r: number,
    hue: number,
    phase: number = 0,
    metabolism: MetabolismType = 'chemoheterotroph',
    morphology?: CellMorphology,
    wall: WallType = 'gram_negative',
    armor: number = 0,
    dividingProgress: number = 0
  ): void {
    const wallPad = this.getWallBaseWidth(wall, armor) * 0.5;
    const rx = this.getSomaHalfWidth(metabolism, r, morphology, dividingProgress) + wallPad * 0.6;
    const ry = this.getSomaHalfHeight(metabolism, r, morphology, dividingProgress) + wallPad * 0.6;
    const outerRx = rx + Math.max(3.5, r * 0.45);
    const outerRy = ry + Math.max(3.2, r * 0.42);

    ctx.save();
    // Matriz extracelular polimérica (EPS) de exopolisacáridos
    ctx.fillStyle = `hsla(${hue}, 68%, 52%, 0.15)`;
    ctx.beginPath();
    ctx.ellipse(0, 0, outerRx * 1.08, outerRy * 1.08, 0, 0, Math.PI * 2);
    ctx.fill();

    // Fimbrias de adhesión radiales ancladas al sustrato
    ctx.strokeStyle = `hsla(${hue}, 75%, 68%, 0.45)`;
    ctx.lineWidth = 0.9;
    const fimbriaeCount = 10;
    ctx.beginPath();
    for (let i = 0; i < fimbriaeCount; i++) {
      const a = (i / fimbriaeCount) * Math.PI * 2 + Math.sin(phase * 0.3 + i) * 0.04;
      const sx = Math.cos(a) * rx * 0.94;
      const sy = Math.sin(a) * ry * 0.94;
      const ex = Math.cos(a) * outerRx;
      const ey = Math.sin(a) * outerRy;
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
    }
    ctx.stroke();

    // Puntos de adhesina en los extremos de las fimbrias
    ctx.fillStyle = `hsla(${hue}, 85%, 76%, 0.55)`;
    ctx.beginPath();
    for (let i = 0; i < fimbriaeCount; i += 2) {
      const a = (i / fimbriaeCount) * Math.PI * 2;
      const ex = Math.cos(a) * outerRx;
      const ey = Math.sin(a) * outerRy;
      ctx.moveTo(ex + 1, ey);
      ctx.arc(ex, ey, 1.0, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.restore();
  }

  /**
   * Renderiza un Bacteriófago T4 (cápside icosaédrica, vaina helicoidal contráctil,
   * placa basal y 6 fibras caudales articuladas).
   */
  public static renderBacteriophage(
    ctx: CanvasRenderingContext2D,
    p: Bacteriophage,
    lowDetail: boolean = false
  ): void {
    const lifeLeftRatio = Math.max(0.15, Math.min(1, (p.maxLifespan - p.age) / 4.0));
    if (lowDetail) {
      ctx.fillStyle = `rgba(192, 132, 252, ${0.85 * lifeLeftRatio})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * 1.05, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle - Math.PI * 0.5);
    ctx.globalAlpha = lifeLeftRatio;

    const r = p.radius;
    const legWave = Math.sin(p.animPhase * 1.4) * 0.45;

    // Halo nanoscópico sutil
    ctx.beginPath();
    ctx.arc(0, 0, r * 2.1, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(168, 85, 247, 0.14)';
    ctx.fill();

    // 1. Fibras caudales (6 patas articuladas tipo módulo lunar en la base)
    ctx.strokeStyle = 'rgba(216, 180, 254, 0.88)';
    ctx.lineWidth = 0.85;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const baseY = r * 0.95;
    ctx.beginPath();
    for (const side of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        const spread = 0.55 + i * 0.36;
        const kneeX = side * r * (0.65 + i * 0.25);
        const kneeY = baseY - r * (0.28 - i * 0.08) + legWave * (i % 2 === 0 ? 1 : -1) * 0.4;
        const tipX = side * r * (1.15 + spread * 0.45);
        const tipY = baseY + r * (0.68 + i * 0.14);
        ctx.moveTo(side * r * 0.22, baseY);
        ctx.lineTo(kneeX, kneeY);
        ctx.lineTo(tipX, tipY);
      }
    }
    ctx.stroke();

    // 2. Vaina caudal contráctil y collar
    ctx.fillStyle = 'rgba(147, 51, 234, 0.9)';
    ctx.strokeStyle = 'rgba(233, 213, 255, 0.92)';
    ctx.lineWidth = 0.75;
    ctx.beginPath();
    ctx.rect(-r * 0.28, -r * 0.15, r * 0.56, r * 1.1);
    ctx.fill();
    ctx.stroke();

    // Placa basal hexagonal con espículas de fijación
    ctx.beginPath();
    ctx.moveTo(-r * 0.48, baseY);
    ctx.lineTo(r * 0.48, baseY);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.1;
    ctx.stroke();

    // 3. Cápside icosaédrica prolatada (cabeza facetada con ADN vírico luminiscente)
    const headY = -r * 0.95;
    const hx = r * 0.92;
    const hy = r * 1.05;
    ctx.beginPath();
    ctx.moveTo(0, headY - hy);
    ctx.lineTo(hx, headY - hy * 0.42);
    ctx.lineTo(hx, headY + hy * 0.42);
    ctx.lineTo(0, headY + hy * 0.85);
    ctx.lineTo(-hx, headY + hy * 0.42);
    ctx.lineTo(-hx, headY - hy * 0.42);
    ctx.closePath();
    ctx.fillStyle = 'rgba(126, 34, 206, 0.92)';
    ctx.fill();
    ctx.lineWidth = 0.95;
    ctx.strokeStyle = 'rgba(233, 213, 255, 0.95)';
    ctx.stroke();

    // Aristas cristalinas internas del icosaedro y genoma empaquetado
    ctx.beginPath();
    ctx.moveTo(-hx, headY - hy * 0.42);
    ctx.lineTo(0, headY);
    ctx.lineTo(hx, headY - hy * 0.42);
    ctx.moveTo(0, headY);
    ctx.lineTo(0, headY + hy * 0.85);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.65)';
    ctx.lineWidth = 0.65;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(-hx * 0.26, headY - hy * 0.22, r * 0.24, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
    ctx.fill();

    ctx.restore();
  }

  /**
   * Renderiza un Glóbulo Blanco Neutrófilo Polimorfonuclear (Leucocito PMN):
   * Membrana ameboide con pseudópodos dinámicos, ectoplasma hialino, gránulos azurófilos,
   * vacuolas digestivas (fagosomas) con restos bacterianos y su característico núcleo trilobulado.
   */
  public static renderNeutrophil(
    ctx: CanvasRenderingContext2D,
    n: Neutrophil,
    lowDetail: boolean = false
  ): void {
    const r = n.radius;
    if (lowDetail) {
      ctx.save();
      if (n.isDying) {
        ctx.globalAlpha = Math.max(0.1, 1 - n.dyingProgress * 0.9);
      }
      ctx.fillStyle = 'rgba(226, 232, 240, 0.55)';
      ctx.strokeStyle = 'rgba(147, 197, 253, 0.85)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Núcleo multilobulado simplificado
      ctx.fillStyle = 'rgba(109, 40, 217, 0.82)';
      ctx.beginPath();
      ctx.arc(n.x - r * 0.24, n.y - r * 0.16, r * 0.24, 0, Math.PI * 2);
      ctx.arc(n.x + r * 0.22, n.y - r * 0.12, r * 0.22, 0, Math.PI * 2);
      ctx.arc(n.x, n.y + r * 0.24, r * 0.23, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

    ctx.save();
    ctx.translate(n.x, n.y);

    if (n.isDying) {
      ctx.globalAlpha = Math.max(0.08, 1 - n.dyingProgress * 0.92);
    }

    // Halo de quimiotaxis / estallido oxidativo (ROS) cuando fagocita
    if (n.attackingTimer > 0 && !n.isDying) {
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.38, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(56, 189, 248, 0.16)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(125, 211, 252, 0.65)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    ctx.rotate(n.angle);

    // 1. Trazado de membrana ameboide deformable con pseudópodos frontales
    const points = 24;
    ctx.beginPath();
    for (let i = 0; i <= points; i++) {
      const theta = (i / points) * Math.PI * 2;
      // El polo frontal (theta ~ 0) extiende lamelipodios/pseudópodos activos
      const frontBias = Math.max(0, Math.cos(theta)) * 0.22;
      const wave1 = Math.sin(theta * 3 + n.animPhase * 1.3) * 0.09;
      const wave2 = Math.cos(theta * 5 - n.animPhase * 0.95) * 0.05;
      const attackStretch = n.attackingTimer > 0 ? Math.cos(theta * 2) * 0.08 : 0;
      const rad = r * (1.0 + frontBias + wave1 + wave2 + attackStretch);
      const px = Math.cos(theta) * rad;
      const py = Math.sin(theta) * rad * 0.92;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();

    // Citoplasma hialino leucocitario con gradiente radial perlado
    const cytoGrad = ctx.createRadialGradient(-r * 0.15, -r * 0.15, r * 0.1, 0, 0, r * 1.25);
    cytoGrad.addColorStop(0, 'rgba(241, 245, 249, 0.68)');
    cytoGrad.addColorStop(0.65, 'rgba(186, 230, 253, 0.46)');
    cytoGrad.addColorStop(1, 'rgba(56, 189, 248, 0.32)');
    ctx.fillStyle = cytoGrad;
    ctx.fill();

    // Borde cortical de actina (ectoplasma brillante)
    ctx.lineWidth = 2.0;
    ctx.strokeStyle = 'rgba(224, 242, 254, 0.88)';
    ctx.stroke();

    // 2. Fagosomas internos (vacuolas digestivas con bacterias engullidas)
    for (let i = 0; i < n.phagosomes.length; i++) {
      const slot = n.phagosomes[i];
      if (!slot.active) continue;
      const vacR = Math.max(2.0, r * 0.19 * (1 - slot.progress * 0.45));
      ctx.beginPath();
      ctx.arc(slot.offsetX, slot.offsetY, vacR * 1.35, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(14, 165, 233, 0.25)';
      ctx.fill();
      ctx.lineWidth = 0.8;
      ctx.strokeStyle = 'rgba(186, 230, 253, 0.65)';
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(slot.offsetX, slot.offsetY, vacR, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${slot.hue}, 75%, 52%, ${Math.max(0.25, 0.85 - slot.progress * 0.6)})`;
      ctx.fill();
    }

    // 3. Gránulos azurófilos (lisosomas cargados de mieloperoxidasa y defensinas)
    ctx.fillStyle = 'rgba(244, 114, 182, 0.55)';
    for (let i = 0; i < 7; i++) {
      const ga = (i / 7) * Math.PI * 2 + 0.3;
      const gd = r * (0.52 + (i % 2) * 0.14);
      ctx.beginPath();
      ctx.arc(Math.cos(ga) * gd, Math.sin(ga) * gd, 1.25, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Núcleo Polimorfonuclear (PMN) característico de 3 lóbulos conectados por puentes de cromatina
    const lobe1X = -r * 0.26;
    const lobe1Y = -r * 0.22;
    const lobe2X = r * 0.16;
    const lobe2Y = -r * 0.24;
    const lobe3X = -r * 0.06;
    const lobe3Y = r * 0.25;

    // Puentes finos de heterocromatina entre los lóbulos nucleares
    ctx.beginPath();
    ctx.moveTo(lobe1X, lobe1Y);
    ctx.quadraticCurveTo(-r * 0.04, -r * 0.08, lobe2X, lobe2Y);
    ctx.quadraticCurveTo(r * 0.08, r * 0.04, lobe3X, lobe3Y);
    ctx.quadraticCurveTo(-r * 0.18, r * 0.02, lobe1X, lobe1Y);
    ctx.strokeStyle = 'rgba(88, 28, 135, 0.85)';
    ctx.lineWidth = 2.1;
    ctx.stroke();

    // Los 3 lóbulos nucleares teñidos de violeta intenso (tinción Wright-Giemsa)
    const lobes: readonly (readonly [number, number, number])[] = [
      [lobe1X, lobe1Y, r * 0.23],
      [lobe2X, lobe2Y, r * 0.21],
      [lobe3X, lobe3Y, r * 0.24],
    ];
    for (let i = 0; i < lobes.length; i++) {
      const [lx, ly, lr] = lobes[i];
      ctx.beginPath();
      ctx.arc(lx, ly, lr, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(109, 40, 217, 0.86)';
      ctx.fill();
      ctx.lineWidth = 1.0;
      ctx.strokeStyle = 'rgba(216, 180, 254, 0.78)';
      ctx.stroke();

      // heterocromatina periférica / brillo nuclear
      ctx.beginPath();
      ctx.arc(lx - lr * 0.25, ly - lr * 0.25, lr * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(192, 132, 252, 0.45)';
      ctx.fill();
    }

    ctx.restore();
  }
}
