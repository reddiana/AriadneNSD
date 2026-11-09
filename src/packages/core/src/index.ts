// The public API of @ariadne-nsd/core. Export only what other packages need.

export type {
  Arm,
  Block,
  BlockKind,
  Branch,
  Call,
  CallTarget,
  Case,
  Content,
  Diagram,
  Doc,
  DoWhile,
  FoldMark,
  For,
  Head,
  Id,
  If,
  Path,
  Process,
  Seq,
  Settings,
  SiteFold,
  TextKind,
  ThemeId,
  View,
  While,
} from './model/types';
export type { IdGenerator, IdKind } from './model/id';
export { contentIds, createIdGenerator, parseId } from './model/id';
export { headName, headParams } from './model/head';

// Text, layout and rendering (02-layout).
export type { CatalogEntry, DrawingMessageKey, Locale } from './i18n/messages';
export {
  catalogEntriesOf,
  catalogProblems,
  drawingCatalogEntries,
  drawingMessage,
  locales,
} from './i18n/messages';
export type { TextSize } from './text/measure-text';
export { fontSizes, lineHeight, measureLine, measureText, splitLines } from './text/measure-text';
export type { Token, TokenKind } from './text/syntax';
export { isTextKind, textKinds, tokenize, tokenLines } from './text/syntax';
export { geometry } from './layout/geometry';
export { defaultFoldName, foldLabel, headLabel, layout } from './layout/layout';
export type { ShownAt, ShownFold, ShownItem, ShownView, SiteRange } from './layout/shown';
export {
  countBlocks,
  insideCall,
  pathSeparator,
  placeSiteFolds,
  prefixInside,
  screenId,
  shownItems,
  shownView,
  splitScreenId,
  topLevel,
} from './layout/shown';
export type { CallParts, CallTextContext } from './layout/call-text';
export { callParts, callText } from './layout/call-text';
export type {
  Box,
  BranchLabel,
  CallWords,
  CaseColumn,
  DiagramLayout,
  HitRegion,
  LayoutNode,
  LayoutResult,
  PlacedText,
} from './layout/types';
export type { PathSegment, Point, Scene, SceneElement, TextRun } from './render/scene';
export { buildScene, drawingFontFamily } from './render/build-scene';
export type { ColorToken, PaletteToken, Theme, ThemeKind } from './render/theme';
export {
  defaultTheme,
  isKnownTheme,
  primitiveColors,
  themeFor,
  themeIds,
  themes,
} from './render/theme';
export type { RenderedSvg } from './render/to-svg';
export { toSvg } from './render/to-svg';
export { usedCodePoints } from './render/used-code-points';
export type { Rendering, SavedDrawing } from './render/render-doc';
export { renderDoc, savedDrawing } from './render/render-doc';

// Invariants and editing commands (01-model 3, 4).
export type { Violation } from './model/invariants';
export { assertInvariants, checkInvariants } from './model/invariants';
export type {
  Clip,
  Command,
  FailResult,
  NewBlockKind,
  Note,
  OkResult,
  Reason,
  ReasonCode,
  Result,
  Side,
  Target,
  WithIds,
  WrapKind,
} from './commands/types';
export type { InsertBlockArgs } from './commands/insert';
export { insertBlock } from './commands/insert';
export type { DeleteBlocksArgs } from './commands/delete';
export { deleteBlocks } from './commands/delete';
export type { EditTextArgs } from './commands/edit-text';
export { editText } from './commands/edit-text';
export type { MoveArgs, MoveBranchArgs } from './commands/move';
export { move, moveBranch } from './commands/move';
export type { MoveToArgs } from './commands/move-to';
export { moveTo } from './commands/move-to';
export type { UnwrapArgs, WrapArgs } from './commands/wrap';
export { unwrap, wrap } from './commands/wrap';
export type { CopyArgs, CopyResult, CutResult, PasteArgs } from './commands/clipboard';
export { copy, cut, paste } from './commands/clipboard';
export type {
  AddDefaultBranchArgs,
  ConvertArgs,
  DeleteBranchArgs,
  InsertBranchArgs,
} from './commands/branch';
export {
  addDefaultBranch,
  convertCaseToIf,
  convertIfToCase,
  deleteBranch,
  insertBranch,
} from './commands/branch';
export type {
  DeleteDiagramArgs,
  EditHeadArgs,
  HeadKind,
  MoveDiagramArgs,
  NewDiagramArgs,
  SetHeadArgs,
  SetSettingsArgs,
} from './commands/diagram';
export {
  defaultHeadName,
  deleteDiagram,
  editHead,
  moveDiagram,
  newDiagram,
  setHead,
  setSettings,
} from './commands/diagram';
export type {
  EditCallArgs,
  InsertCallArgs,
  InsertNamedCallArgs,
  NameCallTargetArgs,
  NewMethodAndCallArgs,
  SetCallTargetArgs,
} from './commands/call';
export {
  editCall,
  insertCall,
  insertNamedCall,
  nameCallTarget,
  newMethodAndCall,
  setCallTarget,
} from './commands/call';
export type { InlineCallArgs, InlineResult } from './commands/inline';
export { inlineCall } from './commands/inline';
export type {
  MakeFoldArgs,
  MakeSiteFoldArgs,
  RemoveFoldArgs,
  RenameFoldArgs,
} from './commands/fold';
export { makeFold, makeSiteFold, removeFold, renameFold, siteFoldOf } from './commands/fold';
export { foldRange } from './commands/seq-edit';
export type { ExtractMethodArgs, ExtractResult } from './commands/extract';
export { extractMethod } from './commands/extract';
export { createContent, createDoc, defaultSettings } from './commands/new-document';

// File format (docs/05-spec/01-file-format.md).
export type { KeptSettings, LoadedDoc } from './format/model-json';
export { currentFormatVersion, serializeModelJson } from './format/model-json';
export type {
  ContentCheck,
  OpenFailureReason,
  OpenResult,
  ReadOptions,
} from './format/parse-model';
export { invariantCheck, parseModel, parseModelJson } from './format/parse-model';
export {
  blockKinds,
  callTargetKinds,
  headKinds,
  headStyles,
  resultSymbols,
} from './format/model-values';
export type { Drawing, EmbeddedFont, SvgFileParts } from './format/svg-file';
export { assembleImageSvg, assembleSvgFile, openSvgFile } from './format/svg-file';

// Export: pure SVG, print and PDF (R-EXP-02, R-EXP-03), text as outlines (R-FMT-10).
export type { SvgOptions } from './render/to-svg';
export type { PlacedGlyph, TextElement } from './render/outline-text';
export { glyphPathData, placeGlyphs, syntheticBoldWidth } from './render/outline-text';
export type { Pagination, Paper, PrintPage } from './export/paginate';
export { pageMargin, paginate, paperForLanguage, papers, pointsPerPixel } from './export/paginate';
export { checkDrawing } from './format/svg-file';
