import { useEffect, useState } from "react";
import { FIELD_KEYS, PROVENANCES, REFERENCE_ROLES, referenceBody, validateFields } from "./domain";
import type { Asset, Reference, SpecField, SpecVersion } from "./types";
import { Field, Id } from "./parts";

export function SpecEditor({version, assets, disabled, onSave}: {version: SpecVersion | null; assets: Asset[]; disabled: boolean; onSave: (body: {fields: Record<string, SpecField>; references: Reference[]; reason: string; expectedVersion?: number}) => Promise<void>}) {
  const [fields, setFields] = useState<Record<string, SpecField>>({intent: {value: "", provenance: "human_explicit", mutability: "editable"}});
  const [references, setReferences] = useState<Reference[]>([]);
  const [reason, setReason] = useState(""); const [error, setError] = useState("");
  useEffect(() => { setFields(structuredClone(version?.fields ?? {intent: {value: "", provenance: "human_explicit", mutability: "editable"}})); setReferences(referenceBody(version?.references ?? [])); setReason(""); setError(""); }, [version?.id]);
  const setField = (key: string, patch: Partial<SpecField>) => setFields(current => ({...current, [key]: {...current[key], ...patch}}));
  return <form onSubmit={event => { event.preventDefault(); setError(""); try { validateFields(fields); void onSave({fields, references: referenceBody(references), reason, ...(version ? {expectedVersion: version.versionNumber} : {})}); } catch (error) { setError(error instanceof Error ? error.message : "内容无效。"); } }}>
    {version && <p>当前版本 {version.versionNumber} · <Id value={version.id} />。保存会追加版本，已锁内容不可改写。</p>}
    <fieldset disabled={disabled}>
      <div className="wb-spec-fields">{FIELD_KEYS.map(key => {
        const field = fields[key]; const locked = version?.fields[key]?.mutability === "locked";
        return <details key={key} open={key === "intent" || Boolean(field)} className="wb-spec-field"><summary>{key}{locked ? " · 已锁定" : ""}</summary>
          <label className="wb-check"><input type="checkbox" checked={Boolean(field)} disabled={locked} onChange={event => setFields(current => { const next = {...current}; if (event.target.checked) next[key] = {value: "", provenance: "human_explicit", mutability: "editable"}; else delete next[key]; return next; })} />包含字段</label>
          {field && <><Field label={`${key} 内容`}>{typeof field.value === "string" ? <textarea value={field.value} maxLength={8192} disabled={locked} onChange={event => setField(key, {value: event.target.value})} /> : <><pre>{JSON.stringify(field.value, null, 2)}</pre><small>结构化原值原样保留。</small></>}</Field>
            <div className="wb-row"><Field label={`${key} 来源`}><select value={field.provenance} disabled={locked} onChange={event => setField(key, {provenance: event.target.value})}>{PROVENANCES.map(value => <option key={value}>{value}</option>)}</select></Field>
            <label className="wb-check"><input type="checkbox" disabled={locked} checked={field.mutability === "locked"} onChange={event => setField(key, {mutability: event.target.checked ? "locked" : "editable"})} />锁定此字段</label></div></>}
        </details>;
      })}</div>
      <h3>语义参考</h3><p>每个参考明确角色和来源；已锁参考完整保留。</p>
      {references.map((reference, index) => {
        const locked = version?.references.some(previous => previous.assetId === reference.assetId && previous.role === reference.role && previous.mutability === "locked");
        const update = (patch: Partial<Reference>) => setReferences(current => current.map((item, i) => i === index ? {...item, ...patch} : item));
        return <div className="wb-reference" key={index}><Field label={`参考 ${index + 1} 素材`}><select required value={reference.assetId} disabled={locked} onChange={event => update({assetId: event.target.value})}><option value="">选择正式素材</option>{!assets.some(asset => asset.id === reference.assetId) && reference.assetId && <option value={reference.assetId}>{reference.assetId}</option>}{assets.map(asset => <option key={asset.id} value={asset.id}>{asset.originalFilename ?? asset.id}</option>)}</select></Field>
          <Field label={`参考 ${index + 1} 角色`}><select disabled={locked} value={reference.role} onChange={event => update({role: event.target.value})}>{REFERENCE_ROLES.map(role => <option key={role}>{role}</option>)}</select></Field>
          <Field label={`参考 ${index + 1} 来源`}><select disabled={locked} value={reference.provenance} onChange={event => update({provenance: event.target.value})}>{PROVENANCES.map(value => <option key={value}>{value}</option>)}</select></Field>
          <label className="wb-check"><input type="checkbox" disabled={locked} checked={reference.mutability === "locked"} onChange={event => update({mutability: event.target.checked ? "locked" : "editable"})} />锁定参考</label>
          <button type="button" disabled={locked} onClick={() => setReferences(current => current.filter((_, i) => i !== index))}>移除参考</button></div>;
      })}
      <button type="button" disabled={references.length >= 64} onClick={() => setReferences(current => [...current, {assetId: "", role: "product_truth", provenance: "human_explicit", mutability: "editable"}])}>添加参考</button>
      <Field label="创作变更理由"><textarea required maxLength={2000} value={reason} onChange={event => setReason(event.target.value)} /></Field>
      <button type="submit">{version ? "追加创作版本" : "创建创作规格"}</button>
    </fieldset>{error && <p role="alert">{error}</p>}
  </form>;
}
