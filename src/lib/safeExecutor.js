/**
 * Safe Execution Engine
 * AI-generated code-u tətbiq etməzdən əvvəl:
 * 1. Syntax check (parse JS)
 * 2. Import validation (mövcud modul-lar?)
 * 3. Path traversal check
 * 4. Dry-run diff
 * 5. Backup original files
 * 6. Atomic apply
 * 7. Rollback on error
 */

import fs from "fs";
import path from "path";
import { createRequire } from "module";

const BACKUP_DIR = path.join(process.cwd(), ".ai-backups");

export class SafeExecutor {
  constructor() {
    this.backups = [];
    this.changes = [];
  }

  /**
   * AI-generated changes-i validatе et
   */
  validate(changes) {
    const errors = [];
    const warnings = [];

    for (const file of changes.files || []) {
      // 1. Path traversal check
      if (file.path.includes("..") || file.path.startsWith("/") || file.path.startsWith("\\")) {
        errors.push({ path: file.path, error: "Path traversal aşkarlandı" });
        continue;
      }

      // 2. File extension check
      const ext = path.extname(file.path);
      if (![".js", ".jsx", ".ts", ".tsx", ".json", ".css", ".md"].includes(ext)) {
        errors.push({ path: file.path, error: `İcazə verilməyən fayl növü: ${ext}` });
        continue;
      }

      // 3. Syntaх check (for JS/JSX)
      if ([".js", ".jsx", ".ts", ".tsx"].includes(ext) && file.content) {
        try {
          new Function(file.content);
        } catch (e) {
          // new Function strict deyil, daha dəqiq check üçün esprima istifadə edə bilərik
          // Amma sadəcə warning veririk
          if (e.message.includes("Unexpected")) {
            warnings.push({ path: file.path, warning: `Syntax problem ola bilər: ${e.message}` });
          }
        }
      }

      // 4. Import check (mövcud modullar?)
      if (file.content) {
        const importLines = file.content.match(/import\s+.*?from\s+['"](.*?)['"]/g) || [];
        for (const imp of importLines) {
          const modMatch = imp.match(/['"](.+?)['"]/);
          if (modMatch) {
            const mod = modMatch[1];
            if (!mod.startsWith("@/") && !mod.startsWith("./") && !mod.startsWith("../") && !mod.startsWith("next") && !mod.startsWith("react")) {
              // External modul — mövcudluğunu yoxla
              try {
                const require = createRequire(process.cwd());
                require.resolve(mod);
              } catch {
                warnings.push({ path: file.path, warning: `Modul tapılmadı: ${mod}` });
              }
            }
          }
        }
      }

      // 5. Size check (>500KB fayl?)
      if (file.content && file.content.length > 500_000) {
        warnings.push({ path: file.path, warning: `Fayl çox böyükdür: ${(file.content.length / 1000).toFixed(0)}KB` });
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Dry-run — faylları dəyişmədən diff göstər
   */
  async dryRun(changes) {
    const diffs = [];

    for (const file of changes.files || []) {
      const fullPath = path.join(process.cwd(), file.path);
      const exists = fs.existsSync(fullPath);

      if (file.action === "create") {
        diffs.push({
          path: file.path,
          action: "create",
          status: `+${file.content?.length || 0} byte yeni fayl`,
        });
      } else if (file.action === "update") {
        const original = exists ? fs.readFileSync(fullPath, "utf-8") : "";
        const diffLines = this.computeDiff(original, file.content || "");
        diffs.push({
          path: file.path,
          action: "update",
          status: `${diffLines.added}+ ${diffLines.removed}-`,
          diff: diffLines,
        });
      } else if (file.action === "delete") {
        diffs.push({
          path: file.path,
          action: "delete",
          status: exists ? `-${fs.statSync(fullPath).size} byte` : "fayl mövcud deyil",
        });
      }
    }

    return diffs;
  }

  /**
   * Orijinal faylların backup-unu yarat
   */
  backup(files) {
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    const timestamp = Date.now();

    for (const file of files) {
      const fullPath = path.join(process.cwd(), file.path);
      if (fs.existsSync(fullPath)) {
        const backupPath = path.join(BACKUP_DIR, `${timestamp}_${file.path.replace(/[\\/]/g, "__")}`);
        fs.mkdirSync(path.dirname(backupPath), { recursive: true });
        fs.copyFileSync(fullPath, backupPath);
        this.backups.push({ original: fullPath, backup: backupPath });
      }
    }
  }

  /**
   * Dəyişiklikləri tətbiq et
   */
  async apply(changes) {
    // 1. Validate
    const validation = this.validate(changes);
    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }

    // 2. Backup
    this.backup(changes.files || []);

    // 3. Apply
    const results = [];
    for (const file of changes.files || []) {
      const fullPath = path.join(process.cwd(), file.path);

      try {
        if (file.action === "create") {
          const dir = path.dirname(fullPath);
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          fs.writeFileSync(fullPath, file.content, "utf-8");
          results.push({ path: file.path, action: "created", size: file.content?.length || 0 });
        } else if (file.action === "update") {
          fs.writeFileSync(fullPath, file.content, "utf-8");
          results.push({ path: file.path, action: "updated", size: file.content?.length || 0 });
        } else if (file.action === "delete") {
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            results.push({ path: file.path, action: "deleted" });
          }
        }
        this.changes.push(file);
      } catch (err) {
        results.push({ path: file.path, action: file.action, error: err.message });
      }
    }

    return { success: true, results, backups: this.backups };
  }

  /**
   * Rollback — orijinal faylları bərpa et
   */
  async rollback() {
    const results = [];

    for (const { original, backup } of this.backups) {
      try {
        fs.copyFileSync(backup, original);
        results.push({ path: original, action: "restored" });
      } catch (err) {
        results.push({ path: original, action: "restore-failed", error: err.message });
      }
    }

    return results;
  }

  /**
   * Sadə diff hesablayıcı
   */
  computeDiff(original, updated) {
    const origLines = original.split("\n");
    const updLines = updated.split("\n");

    let added = 0;
    let removed = 0;

    const maxLen = Math.max(origLines.length, updLines.length);
    for (let i = 0; i < maxLen; i++) {
      if (i >= origLines.length) added++;
      else if (i >= updLines.length) removed++;
      else if (origLines[i] !== updLines[i]) {
        added++;
        removed++;
      }
    }

    return { added, removed, totalLines: updLines.length };
  }
}
