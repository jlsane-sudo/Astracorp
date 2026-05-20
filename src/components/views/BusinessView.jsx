import React, { useEffect, useMemo, useState } from 'react';
import { COMPANY_TYPES, getCompanyBuildCost } from '../../data/companyTypes';
import IndustryVisual from '../../components/IndustryVisual';
import { companyAssets, resourceAssets } from '../../assets/generated/assets';
import { getCompanyGroupMultiplier } from '../../utils/companyMath';

const styles = {
  layout: {
    display: 'grid',
    gap: 12,
  },
  commandDeck: {
    display: 'grid',
    gap: 10,
    padding: 14,
    borderRadius: 16,
    background: 'linear-gradient(135deg, rgba(8,15,30,0.98), rgba(18,24,42,0.98))',
    border: '1px solid rgba(96,165,250,0.16)',
    boxShadow: '0 14px 34px rgba(0,0,0,0.24)',
  },
  commandDeckTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    flexWrap: 'wrap',
  },
  commandDeckTitle: {
    fontSize: 14,
    fontWeight: 900,
    color: '#f8fafc',
    marginBottom: 4,
  },
  commandDeckText: {
    fontSize: 11,
    color: '#94a3b8',
    lineHeight: 1.5,
    maxWidth: 680,
  },
  commandDeckBadge: {
    padding: '6px 10px',
    borderRadius: 999,
    background: 'rgba(59,130,246,0.14)',
    border: '1px solid rgba(96,165,250,0.24)',
    color: '#bfdbfe',
    fontSize: 10,
    fontWeight: 800,
    whiteSpace: 'nowrap',
  },
  commandStatusRow: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  statusPill: {
    padding: '5px 9px',
    borderRadius: 999,
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: 0.35,
    whiteSpace: 'nowrap',
  },
  commandDeckGrid: {
    display: 'grid',
    gridTemplateColumns: '1.25fr 1fr 1fr',
    gap: 10,
  },
  commandDeckGridCompact: {
    gridTemplateColumns: '1fr',
  },
  commandMain: {
    display: 'grid',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    background: 'linear-gradient(180deg, rgba(59,130,246,0.14), rgba(14,23,42,0.42))',
    border: '1px solid rgba(96,165,250,0.2)',
    transition: 'background 220ms ease, border-color 220ms ease, transform 220ms ease',
  },
  commandMainUrgent: {
    background: 'linear-gradient(180deg, rgba(244,63,94,0.16), rgba(14,23,42,0.42))',
    border: '1px solid rgba(248,113,113,0.22)',
  },
  commandMainProfit: {
    background: 'linear-gradient(180deg, rgba(34,197,94,0.16), rgba(14,23,42,0.42))',
    border: '1px solid rgba(74,222,128,0.22)',
  },
  commandMainBuild: {
    background: 'linear-gradient(180deg, rgba(245,158,11,0.16), rgba(14,23,42,0.42))',
    border: '1px solid rgba(251,191,36,0.22)',
  },
  commandMainLabel: {
    fontSize: 10,
    color: '#93c5fd',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontWeight: 800,
  },
  commandMainAction: {
    fontSize: 18,
    fontWeight: 900,
    color: '#ffffff',
    lineHeight: 1.1,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  commandMainWhy: {
    fontSize: 12,
    color: '#dbeafe',
    lineHeight: 1.45,
  },
  commandMainDetail: {
    fontSize: 11,
    color: '#93c5fd',
    lineHeight: 1.4,
  },
  commandCard: {
    display: 'grid',
    gap: 8,
    padding: 12,
    borderRadius: 14,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    transition: 'background 220ms ease, border-color 220ms ease',
  },
  commandCardAlert: {
    border: '1px solid rgba(244,114,182,0.18)',
    background: 'linear-gradient(180deg, rgba(244,114,182,0.08), rgba(255,255,255,0.03))',
  },
  commandCardSuccess: {
    border: '1px solid rgba(74,222,128,0.18)',
    background: 'linear-gradient(180deg, rgba(34,197,94,0.08), rgba(255,255,255,0.03))',
  },
  commandCardTitle: {
    fontSize: 10,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: 800,
  },
  commandCardValue: {
    fontSize: 16,
    fontWeight: 900,
    color: '#f8fafc',
    lineHeight: 1.2,
  },
  commandCardSub: {
    fontSize: 11,
    color: '#cbd5e1',
    lineHeight: 1.45,
  },
  commandActions: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  netFlowPanel: {
    display: 'grid',
    gap: 8,
    padding: 12,
    borderRadius: 14,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  netFlowHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
    flexWrap: 'wrap',
  },
  netFlowTitle: {
    fontSize: 10,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: 800,
  },
  netFlowText: {
    fontSize: 11,
    color: '#cbd5e1',
    lineHeight: 1.45,
  },
  netFlowGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: 8,
  },
  netFlowBox: {
    padding: 10,
    borderRadius: 12,
    background: 'rgba(255,255,255,0.025)',
    border: '1px solid rgba(255,255,255,0.05)',
    display: 'grid',
    gap: 4,
  },
  netFlowName: {
    fontSize: 11,
    fontWeight: 800,
    color: '#f8fafc',
    lineHeight: 1.3,
  },
  netFlowValue: {
    fontSize: 14,
    fontWeight: 900,
    lineHeight: 1.2,
  },
  netFlowMeta: {
    fontSize: 10,
    color: '#94a3b8',
    lineHeight: 1.4,
  },
  netFlowConsumerList: {
    display: 'grid',
    gap: 4,
    marginTop: 2,
  },
  netFlowConsumerItem: {
    fontSize: 10,
    color: '#cbd5e1',
    lineHeight: 1.35,
  },
  commandPrimaryButton: {
    padding: '9px 14px',
    borderRadius: 10,
    border: 'none',
    cursor: 'pointer',
    fontSize: 11,
    fontWeight: 800,
    background: 'linear-gradient(90deg, #3b82f6, #06b6d4)',
    color: '#fff',
    whiteSpace: 'nowrap',
  },
  commandSecondaryButton: {
    padding: '9px 14px',
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.08)',
    cursor: 'pointer',
    fontSize: 11,
    fontWeight: 800,
    background: 'rgba(255,255,255,0.04)',
    color: '#e2e8f0',
    whiteSpace: 'nowrap',
  },
  commandSignal: {
    display: 'inline-flex',
    width: 'fit-content',
    padding: '4px 8px',
    borderRadius: 999,
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: 0.3,
  },
  commandIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    borderRadius: 10,
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.1)',
    fontSize: 14,
    flexShrink: 0,
  },
  adPanel: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
    padding: 14,
    borderRadius: 14,
    background: 'linear-gradient(180deg, rgba(8,15,30,0.96), rgba(3,8,20,0.96))',
    border: '1px solid rgba(56,189,248,0.14)',
    boxShadow: '0 10px 28px rgba(0,0,0,0.2)',
  },
  adTitle: {
    fontSize: 13,
    fontWeight: 800,
    color: '#f8fafc',
    marginBottom: 4,
  },
  adText: {
    fontSize: 11,
    color: '#94a3b8',
    lineHeight: 1.45,
    maxWidth: 520,
  },
  adButton: {
    padding: '9px 14px',
    borderRadius: 10,
    border: '1px solid rgba(56,189,248,0.22)',
    cursor: 'pointer',
    fontSize: 11,
    fontWeight: 800,
    background: 'rgba(56,189,248,0.1)',
    color: '#7dd3fc',
    whiteSpace: 'nowrap',
  },
  bottleneckPanel: {
    display: 'grid',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    background: 'linear-gradient(180deg, rgba(20,17,36,0.96), rgba(7,10,24,0.96))',
    border: '1px solid rgba(244,114,182,0.14)',
    boxShadow: '0 10px 28px rgba(0,0,0,0.2)',
  },
  bottleneckHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    flexWrap: 'wrap',
  },
  bottleneckTitle: {
    fontSize: 13,
    fontWeight: 800,
    color: '#f8fafc',
    marginBottom: 4,
  },
  bottleneckText: {
    fontSize: 11,
    color: '#94a3b8',
    lineHeight: 1.45,
    maxWidth: 620,
  },
  bottleneckGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 8,
  },
  bottleneckBox: {
    padding: 10,
    borderRadius: 12,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  bottleneckLabel: {
    fontSize: 9,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  bottleneckValue: {
    fontSize: 12,
    fontWeight: 800,
    color: '#f8fafc',
    lineHeight: 1.35,
  },
  recommendationButton: {
    padding: '9px 14px',
    borderRadius: 10,
    border: 'none',
    cursor: 'pointer',
    fontSize: 11,
    fontWeight: 800,
    background: 'linear-gradient(90deg, #f59e0b, #ec4899)',
    color: '#fff',
    whiteSpace: 'nowrap',
  },
  wrapper: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: 12,
    alignItems: 'stretch',
  },
  card: {
    position: 'relative',
    background: 'linear-gradient(180deg, rgba(15,23,42,0.92), rgba(2,6,23,0.92))',
    border: '1px solid rgba(148,163,184,0.14)',
    borderRadius: 14,
    padding: 12,
    boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
    overflow: 'hidden',
    display: 'grid',
    gap: 10,
    minHeight: 360,
    alignContent: 'start',
  },
  cardNearFull: {
    boxShadow: '0 0 0 1px rgba(56,189,248,0.18), 0 10px 30px rgba(56,189,248,0.12)',
  },
  cardFull: {
    boxShadow: '0 0 0 1px rgba(34,197,94,0.22), 0 0 28px rgba(34,197,94,0.14)',
  },
  cardOccupied: {
    border: '1px solid rgba(248,113,113,0.24)',
    background: 'linear-gradient(180deg, rgba(127,29,29,0.22), rgba(2,6,23,0.92))',
  },
  cardUnbuilt: {
    border: '1px dashed rgba(148,163,184,0.24)',
    background: 'linear-gradient(180deg, rgba(30,41,59,0.72), rgba(15,23,42,0.92))',
  },
  topGlow: {
    position: 'absolute',
    top: -40,
    right: -20,
    width: 96,
    height: 96,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(34,211,238,0.16), rgba(34,211,238,0))',
    pointerEvents: 'none',
  },
  floatWrap: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    overflow: 'hidden',
  },
  floatText: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    fontSize: 12,
    fontWeight: 900,
    color: '#22c55e',
    textShadow: '0 0 12px rgba(34,197,94,0.35)',
    animation: 'company-float-up 900ms ease-out forwards',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  titleBlock: {
    display: 'grid',
    gap: 5,
    minWidth: 0,
  },
  title: {
    fontSize: 14,
    fontWeight: 800,
    color: '#f8fafc',
    lineHeight: 1.15,
    overflowWrap: 'anywhere',
  },
  subtitleRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 5,
  },
  pill: {
    padding: '3px 7px',
    borderRadius: 999,
    fontSize: 9,
    fontWeight: 700,
    whiteSpace: 'nowrap',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.06)',
    color: '#cbd5e1',
  },
  statusBadge: {
    padding: '4px 7px',
    borderRadius: 999,
    fontSize: 9,
    fontWeight: 800,
    whiteSpace: 'nowrap',
  },
  visualSummary: {
    display: 'grid',
    gap: 10,
    background: 'rgba(255,255,255,0.025)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 8,
    minHeight: 114,
  },
  companyArtStage: {
    position: 'relative',
    minHeight: 168,
    borderRadius: 14,
    overflow: 'hidden',
    background:
      'linear-gradient(145deg, rgba(8,47,73,0.44), rgba(49,46,129,0.18) 52%, rgba(2,6,23,0.84))',
    border: '1px solid rgba(103,232,249,0.16)',
    boxShadow: 'inset 0 0 34px rgba(2,6,23,0.34)',
    display: 'grid',
    placeItems: 'center',
    isolation: 'isolate',
  },
  companyArtStageActive: {
    border: '1px solid rgba(34,211,238,0.34)',
    boxShadow:
      'inset 0 0 34px rgba(2,6,23,0.34), 0 0 24px rgba(34,211,238,0.12)',
  },
  companyArtGrid: {
    position: 'absolute',
    inset: 0,
    zIndex: -2,
    opacity: 0.22,
    backgroundImage:
      'linear-gradient(rgba(103,232,249,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.18) 1px, transparent 1px)',
    backgroundSize: '24px 24px',
  },
  companyArtHalo: {
    position: 'absolute',
    inset: '16% 12%',
    zIndex: -1,
    borderRadius: '50%',
    background:
      'radial-gradient(circle, rgba(34,211,238,0.24), rgba(168,85,247,0.12) 48%, transparent 72%)',
    filter: 'blur(2px)',
  },
  companyArtLarge: {
    width: 128,
    height: 128,
    objectFit: 'cover',
    borderRadius: 24,
    border: '1px solid rgba(103,232,249,0.24)',
    background: 'rgba(2,6,23,0.58)',
    boxShadow: '0 18px 38px rgba(2,6,23,0.34), 0 0 28px rgba(34,211,238,0.12)',
  },
  companyArtFallback: {
    width: 128,
    height: 134,
    display: 'grid',
    placeItems: 'center',
  },
  companyResourceBadge: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    minHeight: 34,
    maxWidth: 'calc(100% - 20px)',
    padding: '6px 9px',
    borderRadius: 10,
    background: 'rgba(2,6,23,0.68)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#e2e8f0',
    fontSize: 10,
    fontWeight: 900,
    overflow: 'hidden',
  },
  companyResourceIcon: {
    width: 22,
    height: 22,
    flex: '0 0 auto',
    borderRadius: 7,
    objectFit: 'cover',
  },
  companyStatusLight: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 999,
    boxShadow: '0 0 14px currentColor',
  },
  compactCompanyArt: {
    width: 64,
    height: 64,
    objectFit: 'cover',
    borderRadius: 12,
    border: '1px solid rgba(103,232,249,0.2)',
    background: 'rgba(2,6,23,0.58)',
    boxShadow: '0 10px 22px rgba(2,6,23,0.2), 0 0 18px rgba(34,211,238,0.08)',
  },
  compactCompanyIdentity: {
    display: 'grid',
    gridTemplateColumns: '64px minmax(0, 1fr)',
    gap: 10,
    alignItems: 'center',
    minWidth: 0,
  },
  compactUnownedArt: {
    width: 54,
    height: 54,
    objectFit: 'cover',
    borderRadius: 11,
    border: '1px solid rgba(148,163,184,0.18)',
    background: 'rgba(2,6,23,0.48)',
    opacity: 0.86,
  },
  unbuiltArt: {
    width: '100%',
    maxWidth: 168,
    aspectRatio: '1',
    objectFit: 'cover',
    justifySelf: 'center',
    borderRadius: 22,
    border: '1px solid rgba(103,232,249,0.18)',
    background: 'rgba(2,6,23,0.58)',
    boxShadow: '0 12px 30px rgba(2,6,23,0.24)',
  },
  metrics: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 7,
  },
  metricBox: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: 10,
    padding: 8,
    minHeight: 54,
  },
  metricLabel: {
    fontSize: 9,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  metricValue: {
    fontSize: 11,
    fontWeight: 800,
    color: '#f8fafc',
  },
  progressWrap: {
    display: 'grid',
    gap: 5,
  },
  progressTop: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 8,
    fontSize: 10,
    color: '#cbd5e1',
  },
  progressOuter: {
    width: '100%',
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
    background: '#0f172a',
    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.04)',
  },
  progressInner: {
    height: '100%',
    borderRadius: 999,
    background: 'linear-gradient(90deg, #22c55e 0%, #06b6d4 55%, #8b5cf6 100%)',
    transition: 'width 0.25s ease',
  },
  helperText: {
    fontSize: 10,
    color: '#cbd5e1',
    lineHeight: 1.4,
  },
  sectorList: {
    display: 'grid',
    gap: 5,
  },
  sectorRow: {
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    gap: 8,
    alignItems: 'center',
    padding: '6px 7px',
    borderRadius: 9,
    background: 'rgba(255,255,255,0.025)',
    border: '1px solid rgba(255,255,255,0.05)',
    fontSize: 10,
    color: '#cbd5e1',
  },
  sectorState: {
    fontSize: 9,
    fontWeight: 800,
    whiteSpace: 'nowrap',
  },
  buttonRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
    gap: 8,
  },
  button: {
    padding: '8px 10px',
    borderRadius: 10,
    border: 'none',
    cursor: 'pointer',
    fontSize: 11,
    fontWeight: 800,
    color: '#ffffff',
  },
  primaryButton: {
    background: 'linear-gradient(90deg, #22c55e, #06b6d4)',
    boxShadow: '0 6px 14px rgba(6,182,212,0.16)',
  },
  buyButton: {
    background: 'linear-gradient(90deg, #f59e0b, #22c55e)',
    boxShadow: '0 6px 14px rgba(245,158,11,0.14)',
  },
  secondaryButton: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#e2e8f0',
  },
  buttonDisabled: {
    opacity: 0.45,
    cursor: 'not-allowed',
    boxShadow: 'none',
  },
  modalOverlay: {
    position: 'fixed',
    top: 'var(--pw-topbar-height, 150px)',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 180,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: 16,
    background: 'rgba(2,6,23,0.72)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
  },
  modalCard: {
    width: 'min(760px, 100%)',
    maxHeight: 'calc(100dvh - var(--pw-topbar-height, 150px) - 32px)',
    overflowY: 'auto',
    display: 'grid',
    gap: 12,
    padding: 16,
    borderRadius: 18,
    background: 'linear-gradient(180deg, rgba(15,23,42,0.98), rgba(2,6,23,0.98))',
    border: '1px solid rgba(148,163,184,0.16)',
    boxShadow: '0 24px 60px rgba(0,0,0,0.38)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  modalClose: {
    minWidth: 38,
    height: 38,
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.04)',
    color: '#e2e8f0',
    cursor: 'pointer',
    fontSize: 16,
    fontWeight: 800,
  },
  propertiesPanel: {
    display: 'grid',
    gap: 8,
    padding: 10,
    borderRadius: 12,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  propertiesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 7,
  },
  propertyBox: {
    background: 'rgba(255,255,255,0.025)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: 10,
    padding: 8,
  },
  propertyTitle: {
    fontSize: 9,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  propertyValue: {
    fontSize: 11,
    fontWeight: 800,
    color: '#f8fafc',
    lineHeight: 1.35,
  },
  sectionTitle: {
    fontSize: 10,
    color: '#7dd3fc',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontWeight: 800,
  },
  inputList: {
    display: 'grid',
    gap: 6,
  },
  inputRow: {
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    gap: 8,
    alignItems: 'center',
    borderRadius: 10,
    padding: '7px 8px',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.05)',
    fontSize: 10,
    color: '#cbd5e1',
  },
  inputRowOk: {
    border: '1px solid rgba(34,197,94,0.16)',
    background: 'rgba(34,197,94,0.06)',
  },

  economyMood: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    padding: '9px 11px',
    borderRadius: 13,
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.025)',
    flexWrap: 'wrap',
  },
  economyMoodTitle: {
    fontSize: 12,
    fontWeight: 900,
    color: '#f8fafc',
  },
  economyMoodText: {
    fontSize: 10,
    color: '#cbd5e1',
    lineHeight: 1.4,
  },
  economyMoodBadge: {
    padding: '6px 10px',
    borderRadius: 999,
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: 0.35,
    whiteSpace: 'nowrap',
  },
  actionImpactBox: {
    display: 'grid',
    gap: 5,
    padding: 9,
    borderRadius: 11,
    background: 'rgba(15,23,42,0.55)',
    border: '1px solid rgba(255,255,255,0.07)',
  },
  actionImpactTitle: {
    fontSize: 10,
    color: '#fde68a',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: 900,
  },
  actionImpactLine: {
    fontSize: 11,
    color: '#e2e8f0',
    lineHeight: 1.35,
  },
  netFlowStatusLine: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    flexWrap: 'wrap',
  },
  netFlowMiniBadge: {
    padding: '3px 7px',
    borderRadius: 999,
    fontSize: 8,
    fontWeight: 900,
    letterSpacing: 0.35,
    textTransform: 'uppercase',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  netFlowLoss: {
    fontSize: 10,
    color: '#fecaca',
    lineHeight: 1.35,
    fontWeight: 800,
  },
  territoryWarning: {
    padding: 8,
    borderRadius: 10,
    background: 'rgba(245,158,11,0.09)',
    border: '1px solid rgba(251,191,36,0.16)',
    color: '#fde68a',
    fontSize: 10,
    lineHeight: 1.4,
  },
  empty: {
    padding: 12,
    borderRadius: 12,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#cbd5e1',
  },
};

const round2 = (n) => parseFloat(Number(n || 0).toFixed(2));

const safeFinite = (value, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const getWholeUnits = (value) => Math.max(0, Math.floor(Number(value || 0)));

const formatNumber = (n, max = 2) =>
  Number(n || 0).toLocaleString('es-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits: max,
  });

function getUnlockLevel(meta) {
  return Number(meta?.unlockLevel ?? meta?.tier ?? 1);
}

function formatInputsSummary(meta) {
  if (!meta?.inputs?.length) return 'Sin insumos';
  return meta.inputs.map((input) => `${input.label || input.key} x${formatNumber(input.amount || 0)}`).join(' + ');
}

function getChainText(meta) {
  const resource = meta?.resourceLabel || meta?.resourceKey || 'recurso';
  return `${formatInputsSummary(meta)} -> ${resource}`;
}

function getCompanySellRefund(typeKey, ownedCount = 1) {
  const previousOwned = Math.max(0, Number(ownedCount || 1) - 1);
  const lastUnitCost = Number(getCompanyBuildCost(typeKey, previousOwned) || 0);
  return round2(Math.max(1, lastUnitCost * 0.45));
}

const formatDuration = (hours) => {
  if (!Number.isFinite(hours) || hours <= 0) return 'Listo';
  const totalMinutes = Math.max(1, Math.ceil(hours * 60));
  const hh = Math.floor(totalMinutes / 60);
  const mm = totalMinutes % 60;

  if (hh <= 0) return `${mm} min`;
  if (mm === 0) return `${hh} h`;
  return `${hh} h ${mm} min`;
};

const formatCountdown = (ms) => {
  const totalSeconds = Math.max(0, Math.ceil(Number(ms || 0) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

function getGroupMissingInputs(group, inventory) {
  const meta = group.meta;
  if (!meta?.inputs?.length) return [];

  return meta.inputs
    .map((input) => {
      const needPerCycle = Number(input.amount || 0);
      const available = Number(inventory?.[input.key] || 0);
      const missing = Math.max(0, needPerCycle - available);

      return {
        key: input.key,
        label: input.label || input.key,
        needPerCycle,
        available,
        missing,
      };
    })
    .filter((item) => item.missing > 0);
}

function getGroupInputStatus(group, inventory) {
  const meta = group.meta;
  if (!meta?.inputs?.length) return [];

  return meta.inputs.map((input) => {
    const needPerCycle = Number(input.amount || 0);
    const available = Number(inventory?.[input.key] || 0);
    const missing = Math.max(0, needPerCycle - available);

    return {
      key: input.key,
      label: input.label || input.key,
      needPerCycle,
      available,
      missing,
      enough: missing <= 0,
    };
  });
}

function formatMissingInputsShort(missingInputs) {
  if (!missingInputs?.length) return '';

  return missingInputs.map((item) => `${item.label} ${formatNumber(item.missing)}`).join('  -  ');
}

function formatInputsInline(inputStatus) {
  if (!inputStatus?.length) return 'Sin insumos';

  return inputStatus
    .map((item) => (
      item.enough
        ? `${item.label} OK`
        : `Falta ${formatNumber(item.missing)} ${item.label}`
    ))
    .join(' · ');
}

function getGroupStatus(group, inventory) {
  const totalStorage = Number(group.totalStorage || 0);
  const totalStored = Number(group.totalStored || 0);
  const missingInputs = getGroupMissingInputs(group, inventory);

  if (group.type === 'research_lab') {
    return { label: 'Soporte', color: '#a78bfa' };
  }

  if (totalStorage > 0 && totalStored >= totalStorage) {
    return { label: 'Lista para recoger', color: '#22c55e' };
  }

  if (missingInputs.length > 0) {
    return { label: `Falta ${missingInputs[0].label}`, color: '#facc15' };
  }

  if (totalStored > 0) {
    return { label: 'Produciendo', color: '#38bdf8' };
  }

  return { label: 'Activa', color: '#a78bfa' };
}

function groupCompanies(companies) {
  const map = {};

  (companies || []).forEach((company) => {
    const typeKey = company?.companyType || company?.type;

    if (!typeKey || !COMPANY_TYPES[typeKey]) return;

    const compoundKey = typeKey;

    if (!map[compoundKey]) {
      map[compoundKey] = {
        key: compoundKey,
        type: typeKey,
        meta: COMPANY_TYPES[typeKey],
        list: [],
      };
    }

    map[compoundKey].list.push(company);
  });

  return Object.values(map).map((group) => {
    const count = group.list.length;
    const activeList = group.list.filter((company) => company?.active !== false);
    const activeCount = activeList.length;
    const occupiedCount = 0;
    const freeCount = activeCount;
    const mult = getCompanyGroupMultiplier(Math.max(1, activeCount));
    const baseMaxStoragePerCompany = Math.max(0, safeFinite(group.meta.maxStorage, 0));
    const fallbackTotalStorage = baseMaxStoragePerCompany * activeCount;

    const normalizedStorageStats = activeList.reduce(
      (acc, company) => {
        const rawMaxStorage = safeFinite(company?.maxStorage, baseMaxStoragePerCompany);
        const saneMaxStorage =
          rawMaxStorage > 0 &&
          (baseMaxStoragePerCompany <= 0 || rawMaxStorage <= baseMaxStoragePerCompany * 20)
            ? rawMaxStorage
            : baseMaxStoragePerCompany;
        const saneStored = Math.max(0, Math.min(saneMaxStorage, safeFinite(company?.storage, 0)));

        return {
          totalStored: acc.totalStored + saneStored,
          totalStorage: acc.totalStorage + saneMaxStorage,
        };
      },
      { totalStored: 0, totalStorage: 0 }
    );

    const occupiedStored = 0;
    const totalStored = normalizedStorageStats.totalStored;
    const totalStorage =
      normalizedStorageStats.totalStorage > 0
        ? normalizedStorageStats.totalStorage
        : fallbackTotalStorage;

    const productionFromHydrated = activeList.reduce(
      (sum, company) => sum + Math.max(0, safeFinite(company?.effectiveRatePerHour, 0)),
      0
    );

    const fallbackProduction =
      activeCount > 0 ? round2(Number(group.meta.ratePerHour || 0) * mult) : 0;
    const production =
      productionFromHydrated > 0
        ? round2(productionFromHydrated)
        : fallbackProduction;

    const remainingStorage = Math.max(0, totalStorage - totalStored);
    const rawTimeToFillHours =
      production > 0 && remainingStorage > 0 ? remainingStorage / production : 0;
    const timeToFillHours = Number.isFinite(rawTimeToFillHours) ? rawTimeToFillHours : 0;

    const sampleCompany = activeList[0] || group.list[0];
    const effectiveGroupMultiplier =
      safeFinite(sampleCompany?.effectiveGroupMultiplier, 0) > 0
        ? safeFinite(sampleCompany?.effectiveGroupMultiplier, mult)
        : mult;

    const regionBonusRate = safeFinite(sampleCompany?.regionalBonusRate, 0);
    const territoryBonusRate = safeFinite(sampleCompany?.controlBonusRate, 0);
    const appliedBonusRate = Math.min(0.01, Math.max(0, safeFinite(sampleCompany?.bonusRate, regionBonusRate + territoryBonusRate)));
    const bonusRegionName = sampleCompany?.bonusRegionName || null;
    const occupationLossPerHour = 0;
    const occupationTaxPending = 0;
    const maintenancePerHour = activeList.reduce(
      (sum, company) => sum + Math.max(0, safeFinite(company?.maintenanceCreditsPerHour, 0)),
      0
    );
    const maintenancePendingCredits = activeList.reduce(
      (sum, company) => sum + Math.max(0, safeFinite(company?.maintenancePendingCredits, 0)),
      0
    );
    const lowestProductionFactor = activeList.reduce(
      (min, company) => Math.min(min, safeFinite(company?.productionFactor, 1)),
      1
    );
    return {
      ...group,
      count,
      activeCount,
      occupiedCount,
      freeCount,
      mult: round2(effectiveGroupMultiplier),
      totalStored: round2(totalStored),
      totalStorage: round2(totalStorage),
      occupiedStored: round2(occupiedStored),
      occupationLossPerHour: round2(occupationLossPerHour),
      occupationTaxPending: round2(occupationTaxPending),
      maintenancePerHour: round2(maintenancePerHour),
      maintenancePendingCredits: round2(maintenancePendingCredits),
      productionFactor: round2(lowestProductionFactor),
      production,
      remainingStorage: round2(remainingStorage),
      timeToFillHours,
      bonusRate: round2(appliedBonusRate),
      regionBonusRate: round2(regionBonusRate),
      territoryBonusRate: round2(territoryBonusRate),
      bonusRegionName,
      regions: [],
      regionLabel: bonusRegionName ? `Bonus: ${bonusRegionName}` : 'Sin bonus territorial',
      resourceLabel: group.meta.resourceLabel || group.meta.resourceKey || 'recurso',
      canCollect: getWholeUnits(totalStored) >= 1,
    };
  });
}

const RESOURCE_TO_COMPANY_TYPE = {
  water: 'dew_collector',
  energy_cells: 'solar_panel',
  mineral: 'surface_mine',
  purified_water: 'water_purifier',
  metal_components: 'smelter',
  oxygen_tanks: 'electrolysis_plant',
  alloy_frames: 'industrial_forge',
  habitat_modules: 'habitat_factory',
};

function getBottleneckInsight(groups, inventory) {
  const blockedGroups = groups
    .map((group) => ({
      group,
      missingInputs: getGroupMissingInputs(group, inventory),
    }))
    .filter((entry) => entry.missingInputs.length > 0)
    .sort((a, b) => b.group.count - a.group.count);

  if (!blockedGroups.length) return null;

  const primary = blockedGroups[0];
  const missing = primary.missingInputs[0];
  const recommendedType = RESOURCE_TO_COMPANY_TYPE[missing?.key] || null;
  const recommendedMeta = recommendedType ? COMPANY_TYPES[recommendedType] : null;
  const ownedProducerCount = groups
    .filter((group) => group.type === recommendedType)
    .reduce((sum, group) => sum + Number(group.count || 0), 0);

  return {
    blockedGroup: primary.group,
    missing,
    recommendedType,
    recommendedMeta,
    ownedProducerCount,
  };
}

function getEconomyInsight(groups, market) {
  const productiveGroups = groups.filter(
    (group) => group.type !== 'research_lab' && Number(group.production || 0) > 0
  );

  const totalProductionPerHour = productiveGroups.reduce(
    (sum, group) => sum + Number(group.production || 0),
    0
  );

  const totalSellValuePerHour = productiveGroups.reduce((sum, group) => {
    const marketPrice = Number(market?.[group.meta.resourceKey]?.price ?? 0) * 0.88;
    return sum + Number(group.production || 0) * marketPrice;
  }, 0);

  const richestGroup =
    productiveGroups
      .map((group) => {
        const marketPrice = Number(market?.[group.meta.resourceKey]?.price ?? 0) * 0.88;
        const creditsPerHour = Number(group.production || 0) * marketPrice;
        return { group, creditsPerHour };
      })
      .sort((a, b) => b.creditsPerHour - a.creditsPerHour)[0] || null;

  return {
    totalProductionPerHour,
    totalSellValuePerHour,
    richestGroup,
  };
}

function getNetFlowInsight(groups, market) {
  const flowMap = {};

  groups.forEach((group) => {
    if (group.type === 'research_lab') return;

    const resourceKey = group.meta.resourceKey;
    const producedPerHour = Number(group.production || 0);

    if (!flowMap[resourceKey]) {
      flowMap[resourceKey] = {
        key: resourceKey,
        name: group.meta.resourceLabel || group.meta.name || resourceKey,
        gross: 0,
        consumed: 0,
        marketValue: 0,
        consumers: [],
      };
    }

    flowMap[resourceKey].gross += producedPerHour;

    (group.meta.inputs || []).forEach((input) => {
      if (!flowMap[input.key]) {
        const sourceMeta =
          Object.values(COMPANY_TYPES).find((item) => item.resourceKey === input.key) || null;

        flowMap[input.key] = {
          key: input.key,
          name: input.label || sourceMeta?.resourceLabel || input.key,
          gross: 0,
          consumed: 0,
          marketValue: 0,
          consumers: [],
        };
      }

      const consumedPerHour = producedPerHour * Number(input.amount || 0);

      flowMap[input.key].consumed += consumedPerHour;
      flowMap[input.key].consumers.push({
        name: group.meta.name,
        amountPerHour: consumedPerHour,
      });
    });
  });

  const flows = Object.values(flowMap)
    .map((entry) => {
      const unitSellPrice = Number(market?.[entry.key]?.price ?? 0) * 0.88;
      return {
        ...entry,
        gross: round2(entry.gross),
        consumed: round2(entry.consumed),
        net: round2(entry.gross - entry.consumed),
        marketValue: round2((entry.gross - entry.consumed) * unitSellPrice),
        consumers: (entry.consumers || [])
          .sort((a, b) => b.amountPerHour - a.amountPerHour)
          .slice(0, 3)
          .map((consumer) => ({
            ...consumer,
            amountPerHour: round2(consumer.amountPerHour),
          })),
      };
    })
    .sort((a, b) => Math.abs(b.net) - Math.abs(a.net));

  const tightestResource = flows.find((entry) => entry.net < 0) || null;

  return {
    flows,
    tightestResource,
  };
}


function getFlowStatus(entry) {
  const net = Number(entry?.net || 0);
  if (net < -50) {
    return {
      label: 'Critico',
      emoji: '',
      color: '#fecaca',
      background: 'rgba(239,68,68,0.12)',
      border: '1px solid rgba(248,113,113,0.22)',
    };
  }
  if (net < 0) {
    return {
      label: 'Inestable',
      emoji: '',
      color: '#fde68a',
      background: 'rgba(245,158,11,0.12)',
      border: '1px solid rgba(251,191,36,0.22)',
    };
  }
  return {
    label: 'Optimo',
    emoji: '',
    color: '#bbf7d0',
    background: 'rgba(34,197,94,0.12)',
    border: '1px solid rgba(74,222,128,0.22)',
  };
}

function getEconomyMood(netFlowInsight, economyInsight) {
  const negativeFlows = (netFlowInsight?.flows || []).filter((entry) => Number(entry.net || 0) < 0);
  const criticalFlows = negativeFlows.filter((entry) => Number(entry.net || 0) < -50);
  const totalNegativeValue = negativeFlows.reduce(
    (sum, entry) => sum + Math.abs(Number(entry.marketValue || 0)),
    0
  );

  if (criticalFlows.length > 0) {
    return {
      label: 'Economia en colapso',
      emoji: '',
      text: `Hay ${criticalFlows.length} recurso(s) en deficit critico. Estas perdiendo unos ${formatNumber(totalNegativeValue, 0)}/h por cuellos de botella.`,
      color: '#fecaca',
      background: 'rgba(239,68,68,0.12)',
      border: '1px solid rgba(248,113,113,0.24)',
    };
  }

  if (negativeFlows.length > 0) {
    return {
      label: 'Economia inestable',
      emoji: '',
      text: `La cadena funciona, pero ${negativeFlows.length} recurso(s) estan en negativo. Prioriza el deficit antes de expandir transformadores.`,
      color: '#fde68a',
      background: 'rgba(245,158,11,0.12)',
      border: '1px solid rgba(251,191,36,0.22)',
    };
  }

  return {
    label: Number(economyInsight?.totalSellValuePerHour || 0) > 0 ? 'BIZ'
              : 'ORB',
    emoji: '',
    text: Number(economyInsight?.totalSellValuePerHour || 0) > 0
      ? 'BIZ'
              : 'ORB',
    color: '#bbf7d0',
    background: 'rgba(34,197,94,0.12)',
    border: '1px solid rgba(74,222,128,0.22)',
  };
}

function getActionImpactLines(recommendedPlan, netFlowInsight) {
  const lines = [];

  if (recommendedPlan.kind === 'build' && recommendedPlan.recommendedMeta) {
    const meta = recommendedPlan.recommendedMeta;
    const flow = (netFlowInsight?.flows || []).find((entry) => entry.key === meta.resourceKey);
    lines.push(`+${formatNumber(meta.ratePerHour || 0, 1)}/h de ${meta.resourceLabel || meta.name}.`);
    if (flow && Number(flow.net || 0) < 0) {
      lines.push(`Reduce el deficit de ${flow.name}: ahora esta en ${formatNumber(flow.net, 1)}/h.`);
    }
    lines.push(recommendedPlan.isCritical
      ? 'Evita ampliar empresas que consuman recursos ya negativos.'
      : 'Mejora la base industrial sin romper la cadena actual.');
    return lines;
  }

  if (recommendedPlan.kind === 'collect') {
    lines.push('Convierte produccion almacenada en inventario util ahora mismo.');
    lines.push('Evita que el almacen se llene y la empresa deje de producir.');
    return lines;
  }

  if (recommendedPlan.kind === 'sell') {
    lines.push('Genera liquidez inmediata con el mejor valor acumulado.');
    lines.push('til si necesitas creditos para construir o reforzar territorios.');
    return lines;
  }

  if (recommendedPlan.kind === 'contract') {
    lines.push('Cierra recompensa directa sin esperar mas produccion.');
    lines.push('Los contratos listos suelen ser mejor que vender al mercado.');
    return lines;
  }

  lines.push('Manten la cadena activa y revisa el proximo cuello de botella.');
  return lines;
}

function getCompanyCountByType(groups, typeKey) {
  return (groups || [])
    .filter((group) => group.type === typeKey)
    .reduce((sum, group) => sum + Number(group.count || 0), 0);
}

function getSmartBuildCandidate({ groups, market, bottleneckInsight, netFlowInsight, playerLevel }) {
  const flowsByKey = Object.fromEntries((netFlowInsight?.flows || []).map((entry) => [entry.key, entry]));
  const tightestKey = netFlowInsight?.tightestResource?.key || null;
  const missingKey = bottleneckInsight?.missing?.key || null;
  const currentLevel = Math.max(1, Number(playerLevel || 1));

  const candidates = Object.entries(COMPANY_TYPES)
    .map(([typeKey, meta]) => {
      if (!meta || typeKey === 'research_lab') return null;
      if (Number(meta.unlockLevel || 1) > currentLevel) return null;

      const producedKey = meta.resourceKey;
      const producedFlow = flowsByKey[producedKey] || null;
      const producedNet = Number(producedFlow?.net || 0);
      const ownedCount = getCompanyCountByType(groups, typeKey);
      const unitSellPrice = Number(market?.[producedKey]?.price ?? 0) * 0.88;
      const valuePerHour = Number(meta.ratePerHour || 0) * unitSellPrice;

      let score = valuePerHour;
      const reasons = [];
      const warnings = [];
      let critical = false;

      if (producedKey === tightestKey) {
        score += 260 + Math.abs(producedNet) * 4;
        critical = true;
        reasons.push(`corrige el deficit principal de ${producedFlow?.name || meta.resourceLabel}`);
      } else if (producedNet < 0) {
        score += 150 + Math.abs(producedNet) * 2.5;
        critical = true;
        reasons.push(`aumenta ${producedFlow?.name || meta.resourceLabel}, que esta en negativo`);
      }

      if (producedKey === missingKey) {
        score += 120;
        reasons.push(`alimenta la cadena bloqueada por ${bottleneckInsight?.missing?.label || meta.resourceLabel}`);
      }

      (meta.inputs || []).forEach((input) => {
        const inputFlow = flowsByKey[input.key] || null;
        const inputNet = Number(inputFlow?.net || 0);
        if (inputNet < 0) {
          const penalty = 320 + Math.abs(inputNet) * 7;
          score -= penalty;
          warnings.push(`consume ${input.label || input.key}, que ya esta en deficit`);
        } else if (inputFlow && inputNet < Number(input.amount || 0) * Number(meta.ratePerHour || 0)) {
          score -= 60;
          warnings.push(`requiere mas ${input.label || input.key} del que sobra con comodidad`);
        }
      });

      score -= ownedCount * 14;

      if ((meta.inputs || []).some((input) => Number(flowsByKey[input.key]?.net || 0) < 0) && ownedCount >= 3) {
        score -= ownedCount * 35;
      }

      if (!reasons.length) {
        reasons.push(`mejora la produccion de ${meta.resourceLabel}`);
      }

      return {
        typeKey,
        meta,
        score,
        critical,
        ownedCount,
        valuePerHour,
        reasons,
        warnings,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);

  const best = candidates[0] || null;
  if (!best || best.score <= 0) return null;

  return {
    kind: 'build',
    label: `Construir ${best.meta.name}`,
    target: best.meta,
    recommendedType: best.typeKey,
    recommendedMeta: best.meta,
    credits: Math.max(0, best.valuePerHour),
    priority: best.critical ? 98 : 55,
    isCritical: best.critical,
    detail: best.warnings.length
      ? `${best.reasons[0]}. Evita ahora edificios que ${best.warnings[0]}.`
      : best.reasons[0],
    actionTab: 'business',
  };
}

const EMPTY_ARRAY = [];
const EMPTY_OBJECT = {};
const EARLY_UNIQUE_COMPANY_LEVEL = 10;
const EARLY_UNIQUE_COMPANY_PLANET = 'nexus-prime';
const EARLY_COMPANY_TYPES = new Set(['dew_collector', 'solar_panel', 'surface_mine']);

function isEarlyUniqueCompanyLimit(save, owned = 0) {
  const planet = save?.player?.currentPlanet || save?.player?.planet || EARLY_UNIQUE_COMPANY_PLANET;
  return planet === EARLY_UNIQUE_COMPANY_PLANET &&
    Number(save?.player?.level ?? 1) <= EARLY_UNIQUE_COMPANY_LEVEL &&
    Number(owned ?? 0) > 0;
}

function getRecommendedPlan({ groups, inventory, market, contracts, bottleneckInsight, netFlowInsight, playerLevel }) {
  const sellCandidate =
    groups
      .filter((group) => Number(group.totalStored || 0) > 0 && group.type !== 'research_lab')
      .map((group) => {
        const sellPrice = Number(market?.[group.meta.resourceKey]?.price ?? 0) * 0.88;
        return {
          kind: 'sell',
          label: `Vender ${group.resourceLabel}`,
          target: group,
          credits: Number(group.totalStored || 0) * sellPrice,
          detail: `${formatNumber(group.totalStored)} en almacen`,
          actionTab: 'market',
        };
      })
      .sort((a, b) => b.credits - a.credits)[0] || null;

  const contractCandidate =
    (contracts || [])
      .map((contract) => {
        const owned = Number(inventory?.[contract.itemKey] ?? 0);
        const qty = Number(contract.qty ?? 0);
        const canDeliver = owned >= qty && Number(contract.expiresAt ?? 0) > Date.now();
        return canDeliver
          ? {
              kind: 'contract',
              label: `Entregar ${contract.title}`,
              target: contract,
              credits: Number(contract.reward?.credits ?? 0),
              detail: `${contract.itemName} x${qty}`,
              actionTab: 'missions',
            }
          : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.credits - a.credits)[0] || null;

  const collectCandidate =
    groups
      .filter((group) => group.canCollect && group.type !== 'research_lab')
      .map((group) => {
        const sellPrice = Number(market?.[group.meta.resourceKey]?.price ?? 0) * 0.88;
        return {
          kind: 'collect',
          label: `Recoger ${group.meta.name}`,
          target: group,
          credits: Number(group.totalStored || 0) * sellPrice,
          detail: `${formatNumber(group.totalStored)} ${group.resourceLabel}`,
          actionTab: 'business',
        };
      })
      .sort((a, b) => b.credits - a.credits)[0] || null;

  const buildCandidate = getSmartBuildCandidate({
    groups,
    market,
    bottleneckInsight,
    netFlowInsight,
    playerLevel,
  });

  const ranked = [contractCandidate, collectCandidate, sellCandidate, buildCandidate]
    .filter(Boolean)
    .map((candidate) => ({
      ...candidate,
      priority:
        Number(candidate.priority || 0) ||
        (candidate.kind === 'contract'
          ? 90
          : candidate.kind === 'collect'
            ? 82
            : candidate.kind === 'sell'
              ? 50
              : candidate.kind === 'build'
                ? 55
                : 10),
    }))
    .sort((a, b) => b.priority - a.priority || b.credits - a.credits);

  const primary = ranked[0] || null;

  if (!primary) {
    return {
      action: 'Esperar produccion',
      why: 'Todavia no hay una jugada clara con valor inmediato.',
      actionTab: 'business',
      helper: 'Deja correr tus empresas o monta una nueva cadena.',
    };
  }

  return {
    action: primary.label,
    kind: primary.kind,
    icon:
      primary.kind === 'contract'
        ? 'CTR'
        : primary.kind === 'collect'
          ? 'REC'
          : primary.kind === 'sell'
            ? 'CR'
            : primary.kind === 'build'
              ? 'BIZ'
              : 'ORB',
    why:
      primary.kind === 'contract'
        ? 'CTR'
        : primary.kind === 'collect'
          ? 'REC'
          : primary.kind === 'sell'
            ? 'Tu mejor liquidez inmediata esta en el mercado actual.'
            : primary.isCritical
              ? 'BIZ'
              : 'ORB',
    actionTab: primary.actionTab,
    helper: primary.detail,
    recommendedType: primary.recommendedType || null,
    recommendedMeta: primary.recommendedMeta || null,
    isCritical: Boolean(primary.isCritical),
  };
}

function CompanyArtwork({
  type,
  resourceKey,
  resourceLabel,
  active = false,
  statusColor = '#38bdf8',
}) {
  const companyArt = companyAssets[type];
  const resourceArt = resourceAssets[resourceKey];

  return (
    <div
      style={{
        ...styles.companyArtStage,
        ...(active ? styles.companyArtStageActive : null),
      }}
    >
      <div style={styles.companyArtGrid} />
      <div style={styles.companyArtHalo} />
      <div style={{ ...styles.companyStatusLight, color: statusColor, background: statusColor }} />

      {companyArt ? (
        <img src={companyArt} alt="" aria-hidden="true" style={styles.companyArtLarge} />
      ) : (
        <div style={styles.companyArtFallback}>
          <IndustryVisual type={type} active={active} size={116} />
        </div>
      )}

      <div style={styles.companyResourceBadge} title={`Produce ${resourceLabel || resourceKey || 'recurso'}`}>
        {resourceArt ? (
          <img src={resourceArt} alt="" aria-hidden="true" style={styles.companyResourceIcon} />
        ) : null}
        <span>{resourceLabel || resourceKey || 'Recurso'}</span>
      </div>
    </div>
  );
}

export function BusinessView({
  save,
  actions,
  companies: companiesProp,
  adBoosts,
  onTriggerCompanyAdBoost,
}) {
  const companies = companiesProp || save?.companies || EMPTY_ARRAY;
  const playerLevel = Number(save?.player?.level ?? 1);
  const inventory = save?.inventory || EMPTY_OBJECT;
  const market = save?.market || EMPTY_OBJECT;
  const [floatingRewards, setFloatingRewards] = useState([]);
  const [openPropertiesKey, setOpenPropertiesKey] = useState(null);
  const [boostNow, setBoostNow] = useState(Date.now());
  const companyBoostUntil = Number(adBoosts?.companyBoostUntil ?? 0);
  const companyBoostRemainingMs = Math.max(0, companyBoostUntil - boostNow);
  const companyBoostActive = companyBoostRemainingMs > 0;
  const companyBoostCountdown = formatCountdown(companyBoostRemainingMs);

  const groups = useMemo(() => groupCompanies(companies), [companies]);
  const ownedCountByType = useMemo(() => {
    return (companies || []).reduce((acc, company) => {
      const typeKey = company?.companyType || company?.type;
      if (!typeKey) return acc;
      acc[typeKey] = Number(acc[typeKey] || 0) + 1;
      return acc;
    }, {});
  }, [companies]);
  const companyShopItems = useMemo(() => {
    const credits = Number(save?.player?.credits ?? 0);
    return Object.values(COMPANY_TYPES)
      .filter((meta) => playerLevel > EARLY_UNIQUE_COMPANY_LEVEL || EARLY_COMPANY_TYPES.has(meta.key))
      .map((meta) => {
        const owned = Number(ownedCountByType[meta.key] || 0);
        const cost = getCompanyBuildCost(meta.key, owned);
        const unlockLevel = getUnlockLevel(meta);
        const hasLevel = playerLevel >= unlockLevel;
        const canAfford = credits >= cost;
        const uniqueBlocked = isEarlyUniqueCompanyLimit(save, owned);
        return {
          meta,
          owned,
          cost,
          unlockLevel,
          hasLevel,
          canAfford,
          uniqueBlocked,
          canBuild: hasLevel && canAfford && !uniqueBlocked,
          outputLabel: meta.resourceLabel || meta.resourceKey || 'recurso',
          chainText: getChainText(meta),
        };
      })
      .sort((a, b) => a.unlockLevel - b.unlockLevel || a.cost - b.cost);
  }, [ownedCountByType, playerLevel, save]);
  const companyShopByType = useMemo(() => {
    return companyShopItems.reduce((acc, item) => {
      acc[item.meta.key] = item;
      return acc;
    }, {});
  }, [companyShopItems]);
  const unownedCompanyShopItems = useMemo(
    () => companyShopItems.filter((item) => item.owned <= 0),
    [companyShopItems]
  );
  const totalCollectable = groups.reduce((sum, group) => sum + (group.type === 'research_lab' ? 0 : getWholeUnits(group.totalStored)), 0);
  const canCollectAll = totalCollectable > 0;
  const showCompanySellControls = playerLevel > 10;
  useEffect(() => {
    if (companyBoostUntil <= Date.now()) {
      setBoostNow(Date.now());
      return undefined;
    }

    const timer = setInterval(() => setBoostNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [companyBoostUntil]);

  const pushFloatingReward = (groupKey, text) => {
    const id = `${groupKey}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    setFloatingRewards((prev) => [...prev, { id, groupKey, text }]);

    setTimeout(() => {
      setFloatingRewards((prev) => prev.filter((item) => item.id !== id));
    }, 950);
  };

  const handleCollectGroup = (group) => {
    const amount = getWholeUnits(group.totalStored);
    if (amount <= 0) return;

    pushFloatingReward(group.key, `+${formatNumber(amount)} ${group.resourceLabel}`.trim());
    actions.collectCompanyGroup(group.type);
  };

  const handleCompanyAdBoost = () => {
    if (companyBoostActive) return;
    onTriggerCompanyAdBoost?.();
  };

  const handleCollectAllWithAd = async () => {
    if (!canCollectAll) return;

    const collected = await actions.collectAllCompaniesWithAd?.();
    if (!collected) return;

    groups
      .filter((group) => group.type !== 'research_lab' && getWholeUnits(group.totalStored) > 0)
      .forEach((group) => {
        pushFloatingReward(group.key, `+${formatNumber(getWholeUnits(group.totalStored))} ${group.resourceLabel}`.trim());
      });
  };


  const openGroup = groups.find((group) => group.key === openPropertiesKey) || null;
  const openGroupInputStatus = openGroup ? getGroupInputStatus(openGroup, inventory) : [];
  const openGroupMissingInputs = openGroup ? getGroupMissingInputs(openGroup, inventory) : [];
  const openGroupIsResearchLab = openGroup?.type === 'research_lab';
  const bottleneckInsight = getBottleneckInsight(groups, inventory);
  const economyInsight = getEconomyInsight(groups, market);
  const netFlowInsight = getNetFlowInsight(groups, market);
  const recommendedPlan = getRecommendedPlan({
    groups,
    inventory,
    market,
    contracts: save?.contracts || [],
    bottleneckInsight,
    economyInsight,
    netFlowInsight,
    playerLevel,
  });
  const economyMood = getEconomyMood(netFlowInsight, economyInsight);
  const actionImpactLines = getActionImpactLines(recommendedPlan, netFlowInsight);
  const isUrgentPlan = recommendedPlan.kind === 'contract' || recommendedPlan.kind === 'collect';
  const isProfitPlan = recommendedPlan.kind === 'sell';
  const isBuildPlan = recommendedPlan.kind === 'build';
  const compactAssistant = typeof window !== 'undefined' && window.innerWidth < 980;
  const commandMainStyle = {
    ...styles.commandMain,
    ...(isUrgentPlan ? styles.commandMainUrgent : null),
    ...(isProfitPlan ? styles.commandMainProfit : null),
    ...(isBuildPlan ? styles.commandMainBuild : null),
    transform: isUrgentPlan ? 'BIZ'
              : 'ORB',
  };
  const planSignalStyle = {
    ...styles.commandSignal,
    ...(isUrgentPlan
      ? {
          background: 'rgba(248,113,113,0.14)',
          border: '1px solid rgba(248,113,113,0.22)',
          color: '#fecaca',
        }
      : isProfitPlan
        ? {
            background: 'rgba(74,222,128,0.14)',
            border: '1px solid rgba(74,222,128,0.22)',
            color: '#bbf7d0',
          }
        : isBuildPlan
          ? {
              background: 'rgba(251,191,36,0.14)',
              border: '1px solid rgba(251,191,36,0.22)',
              color: '#fde68a',
            }
          : {
              background: 'rgba(96,165,250,0.14)',
              border: '1px solid rgba(96,165,250,0.22)',
              color: '#bfdbfe',
            }),
  };

  const compactRows = groups.map((group) => {
    const progress = group.totalStorage > 0 ? (group.totalStored / group.totalStorage) * 100 : 0;
    const status = getGroupStatus(group, inventory);
    const missingInputs = getGroupMissingInputs(group, inventory);
    const missingInputsShort = formatMissingInputsShort(missingInputs);
    const inputSummary = formatInputsInline(getGroupInputStatus(group, inventory));
    const isResearchLab = group.type === 'research_lab';
    const shopItem = companyShopByType[group.type];
    const sellTarget = [...(group.list || [])].reverse().find((company) => company?.active !== false) || group.list?.[group.list.length - 1];
    const sellRefund = getCompanySellRefund(group.type, group.count);
    const maintenanceSummary = isResearchLab
      ? 'Sin mantenimiento'
      : `Mant. ${formatNumber(group.maintenancePerHour, 2)} cr/h · acumulado ${formatNumber(group.maintenancePendingCredits, 2)} cr`;

    return {
      group,
      progress,
      status,
      missingInputsShort,
      inputSummary,
      isResearchLab,
      maintenanceSummary,
      shopItem,
      sellTarget,
      sellRefund,
    };
  });

  return (
    <>
      <div style={styles.layout}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) auto',
          gap: 10,
          alignItems: 'center',
          padding: 10,
          borderRadius: 10,
          background: isUrgentPlan ? 'rgba(127,29,29,0.18)' : 'rgba(8,47,73,0.18)',
          border: isUrgentPlan ? '1px solid rgba(248,113,113,0.24)' : '1px solid rgba(34,211,238,0.18)',
        }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: '#f8fafc', fontSize: 14, fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Produccion de empresas
            </div>
            <div style={{ color: '#94a3b8', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {bottleneckInsight
                ? `Bloqueo: falta ${bottleneckInsight.missing.label}`
                : `${formatNumber(totalCollectable)} uds listas · ${formatNumber(economyInsight.totalProductionPerHour, 1)} u/h`}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={handleCollectAllWithAd}
              disabled={!canCollectAll}
              style={{ ...styles.commandPrimaryButton, ...(!canCollectAll ? styles.buttonDisabled : null) }}
            >
              Recoger todo
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 7 }}>
          {compactRows.map(({ group, progress, status, missingInputsShort, inputSummary, isResearchLab, maintenanceSummary, shopItem, sellTarget, sellRefund }) => (
            <div
              key={group.key}
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(260px, 1.35fr) minmax(150px, 0.95fr) minmax(150px, 1fr) minmax(150px, auto)',
                gap: 8,
                alignItems: 'center',
                minHeight: 82,
                padding: '8px 10px',
                borderRadius: 8,
                background: group.canCollect ? 'rgba(20,83,45,0.12)' : 'rgba(15,23,42,0.55)',
                border: group.canCollect ? '1px solid rgba(74,222,128,0.18)' : '1px solid rgba(148,163,184,0.12)',
              }}
            >
              <div style={styles.compactCompanyIdentity}>
                {companyAssets[group.type] ? (
                  <img
                    src={companyAssets[group.type]}
                    alt=""
                    aria-hidden="true"
                    style={styles.compactCompanyArt}
                  />
                ) : null}
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: '#f8fafc', fontSize: 13, fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {group.meta.icon ? `${group.meta.icon} ` : ''}{group.meta.name} x{group.count}
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {group.resourceLabel} · {group.regionLabel}
                  </div>
                  <div style={{ color: '#cbd5e1', fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {inputSummary}
                  </div>
                </div>
              </div>

              <div style={{ minWidth: 0 }}>
                <div style={{ color: status.color, fontSize: 11, fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {status.label}
                </div>
                <div style={{ color: '#94a3b8', fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {group.activeCount} operativas
                </div>
                <div style={{ color: '#cbd5e1', fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {maintenanceSummary}
                </div>
                {!isResearchLab && (
                  <div style={{ color: group.bonusRate > 0 ? '#86efac' : '#94a3b8', fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {group.bonusRate > 0
                      ? `Bonus sector: +${formatNumber(Math.max(0, group.bonusRate * 100), 1)}%`
                      : 'Sector sin bonus'}
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gap: 4, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, color: '#cbd5e1', fontSize: 10 }}>
                  <span>{isResearchLab ? 'Investigacion' : `${formatNumber(group.totalStored)} / ${formatNumber(group.totalStorage)}`}</span>
                  <span>{isResearchLab ? `-${Math.min(42, group.count * 8)}%` : `${formatNumber(progress, 0)}%`}</span>
                </div>
                {!isResearchLab ? (
                  <div style={styles.progressOuter}>
                    <div style={{ ...styles.progressInner, width: `${Math.max(0, Math.min(100, progress))}%` }} />
                  </div>
                ) : null}
              </div>

              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => handleCollectGroup(group)}
                  disabled={!group.canCollect || isResearchLab}
                  style={{ ...styles.button, ...styles.primaryButton, minWidth: 72, ...(!group.canCollect || isResearchLab ? styles.buttonDisabled : null) }}
                  title={isResearchLab ? 'El laboratorio no genera recogida.' : group.canCollect ? 'Recoger produccion acumulada' : missingInputsShort || 'Aun no hay stock suficiente'}
                >
                  Recoger
                </button>
                <button
                  type="button"
                  onClick={() => actions.buildCompany?.(group.type)}
                  disabled={!shopItem?.canBuild}
                  style={{ ...styles.button, ...styles.buyButton, minWidth: 70, ...(!shopItem?.canBuild ? styles.buttonDisabled : null) }}
                  title={shopItem?.uniqueBlocked ? 'Licencia unica en Nexus Prime hasta nivel 10.' : shopItem?.canBuild ? `Comprar por ${formatNumber(shopItem.cost, 0)} creditos` : 'No disponible ahora'}
                >
                  {shopItem?.uniqueBlocked ? 'Unica' : '+1'}
                </button>
                {showCompanySellControls ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (!sellTarget) return;
                      if (!window.confirm(`Vender una unidad de ${group.meta?.name || group.label || 'esta empresa'} por ${formatNumber(sellRefund, 0)} creditos?`)) return;
                      actions.sellCompany?.(sellTarget.id);
                    }}
                    disabled={!sellTarget}
                    style={{ ...styles.button, ...styles.secondaryButton, minWidth: 70, ...(!sellTarget ? styles.buttonDisabled : null) }}
                  >
                    Vender
                  </button>
                ) : null}
              </div>
            </div>
          ))}

          {unownedCompanyShopItems.map((item) => (
            <div
              key={`new-${item.meta.key}`}
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(240px, 1fr) minmax(120px, auto) minmax(120px, auto)',
                gap: 8,
                alignItems: 'center',
                minHeight: 70,
                padding: '8px 10px',
                borderRadius: 8,
                background: 'rgba(15,23,42,0.38)',
                border: '1px dashed rgba(148,163,184,0.18)',
              }}
            >
              <div style={{ ...styles.compactCompanyIdentity, gridTemplateColumns: '54px minmax(0, 1fr)' }}>
                {companyAssets[item.meta.key] ? (
                  <img
                    src={companyAssets[item.meta.key]}
                    alt=""
                    aria-hidden="true"
                    style={styles.compactUnownedArt}
                  />
                ) : null}
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: '#e2e8f0', fontSize: 12, fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.meta.icon ? `${item.meta.icon} ` : ''}{item.meta.name}
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.outputLabel} · {item.chainText}
                  </div>
                </div>
              </div>
              <div style={{ color: '#cbd5e1', fontSize: 11, fontWeight: 800 }}>
                {formatNumber(item.cost, 0)} cr
              </div>
              <button
                type="button"
                onClick={() => actions.buildCompany?.(item.meta.key)}
                disabled={!item.canBuild}
                style={{ ...styles.button, ...styles.buyButton, ...(!item.canBuild ? styles.buttonDisabled : null) }}
              >
                {item.canBuild ? 'Comprar' : !item.hasLevel ? `Nivel ${item.unlockLevel}` : 'Faltan cr'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {openGroup && (
        <div style={styles.modalOverlay} onClick={() => setOpenPropertiesKey(null)}>
          <div style={styles.modalCard} onClick={(event) => event.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={styles.titleBlock}>
                <div style={styles.title}>
                  {openGroup.meta.icon ? `${openGroup.meta.icon} ` : ''}
                  {openGroup.meta.name}
                </div>
                <div style={styles.subtitleRow}>
                  <span style={styles.pill}>x{openGroup.count}</span>
                  <span style={styles.pill}>{openGroup.activeCount} operativas</span>
                  <span style={styles.pill}>{openGroup.resourceLabel}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOpenPropertiesKey(null)}
                style={styles.modalClose}
                aria-label="Cerrar propiedades"
              >
                x
              </button>
            </div>

            <div style={styles.propertiesPanel}>
              <div>
                <div style={styles.sectionTitle}>Insumos</div>
                <div style={styles.propertiesGrid}>
                  {openGroupInputStatus.map((item) => (
                    <div key={item.key} style={styles.propertyBox}>
                      <div style={styles.propertyName}>{item.label}</div>
                      <div style={styles.propertyMeta}>
                        {formatNumber(item.available)} / {formatNumber(item.needPerCycle)} · {item.enough ? 'OK' : `faltan ${formatNumber(item.missing)}`}
                      </div>
                    </div>
                  ))}
                  {!openGroupInputStatus.length && (
                    <div style={styles.propertyBox}>
                      <div style={styles.propertyName}>Sin insumos</div>
                      <div style={styles.propertyMeta}>Produce directamente.</div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div style={styles.sectionTitle}>Estado</div>
                <div style={styles.propertyBox}>
                  <div style={styles.propertyName}>Mantenimiento</div>
                  <div style={styles.propertyMeta}>
                    {formatNumber(openGroup.maintenancePerHour, 2)} cr/h · acumulado {formatNumber(openGroup.maintenancePendingCredits, 2)} cr
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      <div style={styles.layout}>
        {playerLevel <= 3 && (
          <div
            style={{
              padding: 12,
              borderRadius: 14,
              background: 'rgba(56,189,248,0.08)',
              border: '1px solid rgba(56,189,248,0.16)',
              color: '#dbeafe',
              fontSize: 12,
              lineHeight: 1.55,
            }}
          >
            <strong>Enfoque recomendado:</strong> construye primero agua, luego electricidad y despues
            mineral. No necesitas abrir toda la cadena industrial de golpe: en early game importa
            mas tener una base estable que correr hacia empresas avanzadas.
          </div>
        )}

        <div style={styles.adPanel}>
          <div>
            <div style={styles.adTitle}>Publicidad comun</div>
            <div style={styles.adText}>
              Este impulso afecta a todas tus empresas de produccion y asi evitamos repetir el
              boton en cada tarjeta.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={handleCollectAllWithAd}
              disabled={!canCollectAll}
              style={{
                ...styles.adButton,
                ...(!canCollectAll ? styles.buttonDisabled : null),
              }}
            >
              {canCollectAll
                ? `Recoger todo  ${formatNumber(totalCollectable)} uds`
                : 'Recoger todo'}
            </button>

            <button
              type="button"
              onClick={handleCompanyAdBoost}
              disabled={companyBoostActive}
              style={{
                ...styles.adButton,
                ...(companyBoostActive ? styles.buttonDisabled : null),
              }}
            >
              {companyBoostActive
                ? `Boost x1.5 activo  -  ${companyBoostCountdown}`
                : 'Ver anuncio: x1.5 produccion'}
            </button>
          </div>
        </div>

        <div style={styles.commandDeck}>
          <div style={styles.commandDeckTop}>
            <div>
              <div style={styles.commandDeckTitle}>Asistente de colonia</div>
              <div style={styles.commandDeckText}>
                Este bloque resume tu economia, te marca la mejor jugada inmediata y senala donde
                se esta rompiendo la cadena.
              </div>
            </div>
            <div style={styles.commandStatusRow}>
              <div style={styles.commandDeckBadge}>
                EUR{formatNumber(economyInsight.totalSellValuePerHour, 2)}/h potencial
              </div>
              <div
                style={{
                  ...styles.statusPill,
                  background: bottleneckInsight
                    ? 'BIZ'
              : 'ORB',
                  border: bottleneckInsight
                    ? 'BIZ'
              : 'ORB',
                  color: bottleneckInsight ? 'BIZ'
              : 'ORB',
                }}
              >
                {bottleneckInsight ? 'Atascado' : 'Flujo estable'}
              </div>
              <div
                style={{
                  ...styles.statusPill,
                  background: economyInsight.richestGroup
                    ? 'BIZ'
              : 'ORB',
                  border: economyInsight.richestGroup
                    ? 'BIZ'
              : 'ORB',
                  color: economyInsight.richestGroup ? 'BIZ'
              : 'ORB',
                }}
              >
                {economyInsight.richestGroup ? 'Rentable' : 'En arranque'}
              </div>
            </div>
          </div>

          <div
            style={{
              ...styles.economyMood,
              background: economyMood.background,
              border: economyMood.border,
            }}
          >
            <div>
              <div style={styles.economyMoodTitle}>{economyMood.emoji} {economyMood.label}</div>
              <div style={styles.economyMoodText}>{economyMood.text}</div>
            </div>
            <div
              style={{
                ...styles.economyMoodBadge,
                background: economyMood.background,
                border: economyMood.border,
                color: economyMood.color,
              }}
            >
              {bottleneckInsight ? 'Prioridad: reparar cadena' : 'Prioridad: escalar'}
            </div>
          </div>

          <div
            style={{
              ...styles.commandDeckGrid,
              ...(compactAssistant ? styles.commandDeckGridCompact : null),
            }}
          >
            <div style={commandMainStyle}>
              <div style={styles.commandMainLabel}>{recommendedPlan.isCritical ? 'Bloqueo de produccion' : 'Haz ahora'}</div>
              <div style={planSignalStyle}>
                {isUrgentPlan
                  ? 'Urgente'
                  : isProfitPlan
                    ? 'Rentable'
                    : isBuildPlan
                      ? 'Expansion'
                      : 'Seguimiento'}
              </div>
              <div style={styles.commandMainAction}>
                <span style={styles.commandIcon}>{recommendedPlan.icon || ''}</span>
                <span>{recommendedPlan.action}</span>
              </div>
              <div style={styles.commandMainWhy}>{recommendedPlan.why}</div>
              <div style={styles.commandMainDetail}>{recommendedPlan.helper}</div>
              <div style={styles.actionImpactBox}>
                <div style={styles.actionImpactTitle}>Impacto de accion</div>
                {actionImpactLines.map((line) => (
                  <div key={line} style={styles.actionImpactLine}> {line}</div>
                ))}
              </div>
              <div style={styles.commandActions}>
                <button
                  type="button"
                  onClick={() => actions.setTab?.(recommendedPlan.actionTab)}
                  style={styles.commandPrimaryButton}
                >
                  Ir al panel
                </button>

              </div>
            </div>

            <div
              style={{
                ...styles.commandCard,
                ...(economyInsight.totalSellValuePerHour > 0 ? styles.commandCardSuccess : null),
              }}
            >
              <div style={styles.commandCardTitle}>Pulso economico</div>
              <div style={styles.commandCardValue}>
                {formatNumber(economyInsight.totalProductionPerHour, 1)} u/h
              </div>
              <div style={styles.commandCardSub}>
                Tu industria podria mover EUR{formatNumber(economyInsight.totalSellValuePerHour, 2)}
                por hora al precio actual.
              </div>
            </div>

            <div style={{ ...styles.commandCard, ...styles.commandCardSuccess }}>
              <div style={styles.commandCardTitle}>Cadena clave</div>
              <div style={styles.commandCardValue}>
                {economyInsight.richestGroup
                  ? economyInsight.richestGroup.group.meta.name
                  : 'Sin produccion activa'}
              </div>
              <div style={styles.commandCardSub}>
                {economyInsight.richestGroup
                  ? `Rinde EUR${formatNumber(economyInsight.richestGroup.creditsPerHour, 2)}/h.`
                  : 'Construye una cadena para empezar a escalar.'}
              </div>
            </div>

            <div
              style={{
                ...styles.commandCard,
                ...(bottleneckInsight ? styles.commandCardAlert : null),
              }}
            >
              <div style={styles.commandCardTitle}>Cuello de botella</div>
              <div style={styles.commandCardValue}>
                {bottleneckInsight
                  ? bottleneckInsight.blockedGroup.meta.name
                  : 'Cadena estable'}
              </div>
              <div style={styles.commandCardSub}>
                {bottleneckInsight
                  ? `Falta ${bottleneckInsight.missing.label}  -  ${formatNumber(
                      bottleneckInsight.missing.missing
                    )}.`
                  : 'No hay bloqueos graves de insumos ahora mismo.'}
              </div>
            </div>
          </div>

          <div style={styles.netFlowPanel}>
            <div style={styles.netFlowHeader}>
              <div>
                <div style={styles.netFlowTitle}>Produccion neta</div>
                <div style={styles.netFlowText}>
                  Aqui ves por recurso cuanto produce tu colonia, cuanto consume la cadena y el
                  saldo real por hora.
                </div>
              </div>
              <div
                style={{
                  ...styles.statusPill,
                  background: netFlowInsight.tightestResource
                    ? 'BIZ'
              : 'ORB',
                  border: netFlowInsight.tightestResource
                    ? 'BIZ'
              : 'ORB',
                  color: netFlowInsight.tightestResource ? 'BIZ'
              : 'ORB',
                }}
              >
                {netFlowInsight.tightestResource
                  ? `Deficit en ${netFlowInsight.tightestResource.name}`
                  : 'Balance positivo'}
              </div>
            </div>

            <div style={styles.netFlowGrid}>
              {netFlowInsight.flows.slice(0, 6).map((entry) => {
                const tone =
                  entry.net > 0 ? '#86efac' : entry.net < 0 ? '#fca5a5' : '#cbd5e1';
                const flowStatus = getFlowStatus(entry);
                const lossValue = entry.net < 0 ? Math.abs(Number(entry.marketValue || 0)) : 0;

                return (
                  <div key={entry.key} style={styles.netFlowBox}>
                    <div style={styles.netFlowStatusLine}>
                      <div style={styles.netFlowName}>{entry.name}</div>
                      <div
                        style={{
                          ...styles.netFlowMiniBadge,
                          background: flowStatus.background,
                          border: flowStatus.border,
                          color: flowStatus.color,
                        }}
                      >
                        {flowStatus.emoji} {flowStatus.label}
                      </div>
                    </div>
                    <div style={{ ...styles.netFlowValue, color: tone }}>
                      {entry.net > 0 ? '+' : ''}
                      {formatNumber(entry.net, 2)}/h
                    </div>
                    {lossValue > 0 && (
                      <div style={styles.netFlowLoss}>Perdida estimada: EUR{formatNumber(lossValue, 0)}/h</div>
                    )}
                    <div style={styles.netFlowMeta}>
                      Bruto {formatNumber(entry.gross, 2)}/h  -  Consumo{' '}
                      {formatNumber(entry.consumed, 2)}/h
                    </div>
                    {entry.consumers?.length ? (
                      <div style={styles.netFlowConsumerList}>
                        {entry.consumers.map((consumer) => (
                          <div
                            key={`${entry.key}-${consumer.name}`}
                            style={styles.netFlowConsumerItem}
                          >
                            {consumer.name}: -{formatNumber(consumer.amountPerHour, 2)}/h
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {!groups.length && (
          <div style={styles.empty}>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Empresas</div>
            <div>No tienes empresas todavia. Compra la primera desde una de las tarjetas disponibles.</div>
          </div>
        )}

        <div style={styles.wrapper}>
          {groups.map((group) => {
            const progress =
              group.totalStorage > 0 ? (group.totalStored / group.totalStorage) * 100 : 0;
            const status = getGroupStatus(group, inventory);
            const missingInputs = getGroupMissingInputs(group, inventory);
            const missingInputsShort = formatMissingInputsShort(missingInputs);
            const isResearchLab = group.type === 'research_lab';
            const isFull = progress >= 100;
            const isNearFull = progress >= 85 && progress < 100;
            const cardFloating = floatingRewards.filter((item) => item.groupKey === group.key);
            const sellTarget = [...(group.list || [])].reverse().find((company) => company?.active !== false) || group.list?.[group.list.length - 1];
            const sellRefund = getCompanySellRefund(group.type, group.count);
            const shopItem = companyShopByType[group.type];

            const cardStyle = {
              ...styles.card,
              ...(isNearFull ? styles.cardNearFull : null),
              ...(isFull ? styles.cardFull : null),
            };

            return (
              <div key={group.key} style={cardStyle}>
                <div style={styles.topGlow} />

                <div style={styles.floatWrap}>
                  {cardFloating.map((item) => (
                    <div key={item.id} style={styles.floatText}>
                      {item.text}
                    </div>
                  ))}
                </div>

                <div style={styles.headerRow}>
                  <div style={styles.titleBlock}>
                    <div style={styles.title}>
                      {group.meta.icon ? `${group.meta.icon} ` : ''}
                      {group.meta.name}
                    </div>

                    <div style={styles.subtitleRow}>
                      <span style={styles.pill}>x{group.count}</span>
                      <span style={styles.pill}>{group.activeCount} operativas</span>
                    </div>
                  </div>

                  <div
                    style={{
                      ...styles.statusBadge,
                      background: `${status.color}20`,
                      color: status.color,
                      border: `1px solid ${status.color}35`,
                    }}
                  >
                    {status.label}
                  </div>
                </div>

                <div style={styles.visualSummary}>
                  <CompanyArtwork
                    type={group.type}
                    resourceKey={group.meta.resourceKey}
                    resourceLabel={group.resourceLabel}
                    active={group.totalStorage > 0 && group.totalStored < group.totalStorage}
                    statusColor={status.color}
                  />

                  <div style={styles.metrics}>
                    <div style={styles.metricBox}>
                      <div style={styles.metricLabel}>Almacen</div>
                      <div style={styles.metricValue}>
                        {formatNumber(group.totalStored)} / {formatNumber(group.totalStorage)}
                      </div>
                    </div>

                    <div style={styles.metricBox}>
                      <div style={styles.metricLabel}>Produccion/h</div>
                      <div style={styles.metricValue}>
                        {isResearchLab
                          ? `-${Math.min(42, group.count * 8)}%`
                          : formatNumber(group.production)}
                      </div>
                    </div>

                    <div style={styles.metricBox}>
                      <div style={styles.metricLabel}>Mantenimiento/h</div>
                      <div style={styles.metricValue}>
                        {isResearchLab ? '0' : `${formatNumber(group.maintenancePerHour, 2)} cr`}
                      </div>
                    </div>
                  </div>
                </div>

                {!isResearchLab && (
                  <div style={styles.progressWrap}>
                    <div style={styles.progressTop}>
                      <span>Carga</span>
                      <span>{formatNumber(Math.max(0, Math.min(100, progress)), 0)}%</span>
                    </div>

                    <div style={styles.progressOuter}>
                      <div
                        style={{
                          ...styles.progressInner,
                          width: `${Math.max(0, Math.min(100, progress))}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                <div style={styles.helperText}>
                  {isResearchLab
                    ? `Reduce un ${Math.min(42, group.count * 8)}% el tiempo de investigacion.`
                    : missingInputs.length > 0
                        ? `No produce: faltan ${missingInputsShort}.`
                        : group.canCollect
                          ? `Listo para recoger ${formatNumber(group.totalStored)} ${group.resourceLabel}.`
                          : `Produciendo ${group.resourceLabel}. ${group.regionLabel}. Mantenimiento acumulado: ${formatNumber(group.maintenancePendingCredits, 2)} creditos.`}
                </div>

                <div style={styles.buttonRow}>
                  <button
                    type="button"
                    onClick={() => actions.buildCompany?.(group.type)}
                    disabled={!shopItem?.canBuild}
                    style={{
                      ...styles.button,
                      ...styles.buyButton,
                      ...(!shopItem?.canBuild ? styles.buttonDisabled : null),
                    }}
                  >
                    {shopItem?.canBuild
                      ? `Comprar +1 (${formatNumber(shopItem.cost, 0)})`
                      : shopItem?.uniqueBlocked
                        ? 'Licencia unica'
                        : !shopItem?.hasLevel
                        ? `Nivel ${shopItem?.unlockLevel ?? '-'}`
                        : 'Faltan creditos'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCollectGroup(group)}
                    disabled={!group.canCollect || isResearchLab}
                    style={{
                      ...styles.button,
                      ...styles.primaryButton,
                      ...(!group.canCollect || isResearchLab ? styles.buttonDisabled : null),
                    }}
                  >
                    {isResearchLab ? 'Sin recogida' : 'Recoger'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setOpenPropertiesKey(group.key)}
                    style={{
                      ...styles.button,
                      ...styles.secondaryButton,
                    }}
                  >
                    Propiedades
                  </button>

                  {showCompanySellControls ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (!sellTarget) return;
                        const confirmed = window.confirm(
                          `Vender una unidad de ${group.meta?.name || group.label || 'esta empresa'} por ${formatNumber(sellRefund, 0)} creditos?`
                        );
                        if (!confirmed) return;
                        actions.sellCompany?.(sellTarget.id);
                      }}
                      disabled={!sellTarget}
                      style={{
                        ...styles.button,
                        ...styles.secondaryButton,
                        ...(!sellTarget ? styles.buttonDisabled : null),
                      }}
                    >
                      Vender +{formatNumber(sellRefund, 0)}
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}

          {unownedCompanyShopItems.map((item) => (
            <div key={`new-${item.meta.key}`} style={{ ...styles.card, ...styles.cardUnbuilt }}>
              <div style={styles.topGlow} />

              <div style={styles.headerRow}>
                <div style={styles.titleBlock}>
                  <div style={styles.title}>
                    {item.meta.icon ? `${item.meta.icon} ` : ''}
                    {item.meta.name}
                  </div>
                  <div style={styles.subtitleRow}>
                    <span style={styles.pill}>Nueva</span>
                    <span style={styles.pill}>Nivel {item.unlockLevel}</span>
                    <span style={styles.pill}>{item.outputLabel}</span>
                  </div>
                </div>

                <div style={styles.statusBadge}>Disponible</div>
              </div>

              <CompanyArtwork
                type={item.meta.key}
                resourceKey={item.meta.resourceKey}
                resourceLabel={item.outputLabel}
                active={false}
                statusColor={item.canBuild ? '#22c55e' : '#94a3b8'}
              />

              <div style={styles.helperText}>
                {item.meta.description || `Construye esta empresa para producir ${item.outputLabel}.`}
              </div>

              <div style={styles.metrics}>
                <div style={styles.metricBox}>
                  <div style={styles.metricLabel}>Coste</div>
                  <div style={styles.metricValue}>{formatNumber(item.cost, 0)}</div>
                </div>
                <div style={styles.metricBox}>
                  <div style={styles.metricLabel}>Cadena</div>
                  <div style={styles.metricValue}>{item.chainText}</div>
                </div>
              </div>

              <div style={styles.buttonRow}>
                <button
                  type="button"
                  onClick={() => actions.buildCompany?.(item.meta.key)}
                  disabled={!item.canBuild}
                  style={{
                    ...styles.button,
                    ...styles.buyButton,
                    ...(!item.canBuild ? styles.buttonDisabled : null),
                  }}
                >
                  {item.canBuild ? 'Comprar empresa' : !item.hasLevel ? `Nivel ${item.unlockLevel}` : 'Faltan creditos'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {openGroup && (
        <div style={styles.modalOverlay} onClick={() => setOpenPropertiesKey(null)}>
          <div style={styles.modalCard} onClick={(event) => event.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={styles.titleBlock}>
                <div style={styles.title}>
                  {openGroup.meta.icon ? `${openGroup.meta.icon} ` : ''}
                  {openGroup.meta.name}
                </div>
                <div style={styles.subtitleRow}>
                  <span style={styles.pill}>x{openGroup.count}</span>
                  <span style={styles.pill}>{openGroup.activeCount} operativas</span>
                  <span style={styles.pill}>{openGroup.resourceLabel}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOpenPropertiesKey(null)}
                style={styles.modalClose}
                aria-label="Cerrar propiedades"
              >
                
              </button>
            </div>

            <div style={styles.propertiesPanel}>
              <div style={styles.propertiesGrid}>
                <div style={styles.propertyBox}>
                  <div style={styles.propertyTitle}>Recurso</div>
                  <div style={styles.propertyValue}>{openGroup.resourceLabel}</div>
                </div>

                <div style={styles.propertyBox}>
                  <div style={styles.propertyTitle}>Bonus territorial</div>
                  <div style={styles.propertyValue}>{openGroup.bonusRegionName || 'Sin bonus'}</div>
                </div>

                <div style={styles.propertyBox}>
                  <div style={styles.propertyTitle}>Tiempo hasta llenarse</div>
                  <div style={styles.propertyValue}>
                    {openGroupIsResearchLab ? 'No aplica' : formatDuration(openGroup.timeToFillHours)}
                  </div>
                </div>

                <div style={styles.propertyBox}>
                  <div style={styles.propertyTitle}>Multiplicador</div>
                  <div style={styles.propertyValue}>x{formatNumber(openGroup.mult, 2)}</div>
                </div>

                <div style={styles.propertyBox}>
                  <div style={styles.propertyTitle}>Bonus total</div>
                  <div style={styles.propertyValue}>
                    {openGroup.bonusRate > 0
                      ? `+${formatNumber(Math.max(0, openGroup.bonusRate * 100), 1)}%`
                      : 'Sin bonus'}
                  </div>
                </div>

                <div style={styles.propertyBox}>
                  <div style={styles.propertyTitle}>Bonus base sector</div>
                  <div style={styles.propertyValue}>
                    {openGroup.regionBonusRate > 0
                      ? `+${formatNumber(Math.max(0, openGroup.regionBonusRate * 100), 1)}%`
                      : 'Sin bonus'}
                  </div>
                </div>

                <div style={styles.propertyBox}>
                  <div style={styles.propertyTitle}>Extra control</div>
                  <div style={styles.propertyValue}>
                    {openGroup.territoryBonusRate > 0
                      ? `+${formatNumber(Math.max(0, openGroup.territoryBonusRate * 100), 1)}%`
                      : 'Sin extra'}
                  </div>
                </div>

              </div>

              {openGroupInputStatus.length > 0 && (
                <>
                  <div style={styles.sectionTitle}>Insumos</div>
                  <div style={styles.inputList}>
                    {openGroupInputStatus.map((item) => (
                      <div
                        key={item.key}
                        style={{
                          ...styles.inputRow,
                          ...(item.enough ? styles.inputRowOk : null),
                        }}
                      >
                        <span>
                          {item.label}  -  necesita {formatNumber(item.needPerCycle)}
                        </span>
                        <strong>
                          {formatNumber(item.available)} / {formatNumber(item.needPerCycle)}
                        </strong>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {openGroupMissingInputs.length > 0 && (
                <>
                  <div style={styles.sectionTitle}>Estado</div>
                  <div style={styles.helperText}>
                    Faltan {formatMissingInputsShort(openGroupMissingInputs)} para que la cadena
                    vuelva a producir con normalidad.
                  </div>
                </>
              )}

              {showCompanySellControls ? (
                <>
                  <div style={styles.sectionTitle}>Gestion</div>
                  <div style={styles.helperText}>
                    Puedes vender una unidad de esta empresa por {formatNumber(getCompanySellRefund(openGroup.type, openGroup.count), 0)} creditos. El reembolso es parcial para evitar arbitraje economico.
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const sellTarget = [...(openGroup.list || [])].reverse().find((company) => company?.active !== false) || openGroup.list?.[openGroup.list.length - 1];
                      if (!sellTarget?.id) return;
                      const confirmed = window.confirm(
                        `Vender una unidad de ${openGroup.meta?.name || 'esta empresa'}?`
                      );
                      if (!confirmed) return;
                      actions.sellCompany?.(sellTarget.id);
                      setOpenPropertiesKey(null);
                    }}
                    style={{ ...styles.button, ...styles.secondaryButton }}
                  >
                    Vender una unidad
                  </button>
                </>
              ) : null}

              {openGroup.meta.description && (
                <>
                  <div style={styles.sectionTitle}>Descripcion</div>
                  <div style={styles.helperText}>{openGroup.meta.description}</div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default BusinessView;




