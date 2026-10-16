# Hillman–Grassl 対応

組合せ論の重要な全単射「**Hillman–Grassl 対応**」を解説・体験できる GitHub Pages サイトです。

🔗 **サイト URL**: <https://Maruoka842.github.io/hillman_grassel/>

---

## 概要

Hillman–Grassl 対応（Hillman–Grassl correspondence）は、1976年に A. P. Hillman と R. M. Grassl によって発見された組合せ論の全単射で、

- **λ-配列**（ヤング図形 λ の形に非負整数を並べた表）
- **逆平面分割**（各行・各列で広義単調増加する λ-配列 / reverse plane partition）

の間の一対一対応を与えます。

この対応は、フック長の積公式の組合せ論的証明と深く関わり、現代の代数的組合せ論において基本的なツールの一つです。

## サイトの構成

| ファイル | 内容 |
|---|---|
| `index.html` | メインページ（概要・定義・アルゴリズム・デモ・参考文献） |
| `style.css` | スタイルシート |
| `script.js` | Hillman–Grassl 対応のアルゴリズム実装とインタラクティブデモ |

## 主な内容

- **概要**: Hillman–Grassl 対応が証明する母関数等式の紹介
- **定義**: ヤング図形・フック長・逆平面分割の定義（KaTeX で数式描画）
- **アルゴリズム**: 逆写像 H⁻¹ の手順をステップごとに解説
- **フック長公式の証明**: Hillman–Grassl 対応と MacMahon–Stanley の定理を用いた母関数の極限操作による証明
- **インタラクティブデモ**: 任意の分割 λ と λ-配列 M を入力して H(M) を計算

## GitHub Pages

このサイトはビルド不要の静的サイトです。GitHub Pages の公開元を `main` ブランチの `/ (root)` に設定すると、上記 URL で公開できます。

## 技術スタック

- 純粋な HTML / CSS / JavaScript（ビルド不要）
- [KaTeX](https://katex.org/) — 数式のブラウザ描画
- GitHub Pages — 静的サイトのホスティング

## 参考文献

- R. P. Stanley, *Enumerative Combinatorics*, Vol. 2, Cambridge University Press, 1999. Section 7.22.

## ライセンス

MIT

