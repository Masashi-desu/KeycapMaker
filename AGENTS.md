# KeycapMakerのエージェント向け開発案内

作業前にrootの [README.md](README.md) と [CONTRIBUTING.md](CONTRIBUTING.md) を読み、branch運用、変更分類、品質gate、実装・文書同期の規約に従ってください。共通規約の正本はCONTRIBUTING.mdです。

ユーザーが操作する機能の追加・変更では、CONTRIBUTING.mdの「WebMCPを維持する実装規約」に従い、UIとエージェントの共通処理、tool/catalog/schema、結果・失敗の契約、test、文書への影響を同じ変更で確認してください。公開対象外にする機能は理由を [WebMCP操作契約](docs/architecture/webmcp.md) に記録してください。
