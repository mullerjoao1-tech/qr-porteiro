export default function LitoralPage() {
  const whatsapp =
    "https://wa.me/5541999821219?text=Ol%C3%A1!%20Quero%20reservar%20uma%20das%20vagas%20do%20piloto%20do%20QR%20Acesso%20no%20litoral.";

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 px-6 py-16">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-blue-300 font-semibold mb-3">
              QR ACESSO LITORAL
            </p>

            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
              Seu interfone ou porteiro eletrônico vive estragando por causa da{" "}
              <span className="text-blue-400">maresia?</span>
            </h1>

            <p className="text-xl text-slate-300 mb-6">
              Reduza manutenção, aumente a segurança e modernize o acesso do
              seu condomínio com atendimento remoto direto pelo celular.
            </p>

            <div className="bg-slate-900 border border-blue-500 rounded-2xl p-5 mb-6 max-w-xl">
              <p className="text-lg">
                💰{" "}
                <span className="text-yellow-400 font-bold text-3xl">
                  ATÉ 50%
                </span>{" "}
                <strong>MAIS BARATO</strong>
              </p>
              <p className="text-slate-300">
                que uma portaria remota tradicional.
              </p>
            </div>

            <p className="text-yellow-300 font-semibold mb-4">
              ⚠ Apenas 5 vagas para condomínios nesta fase inicial
            </p>

            <a
              href={whatsapp}
              target="_blank"
              rel="noreferrer"
              className="inline-block bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-xl text-lg font-bold"
            >
              Reservar uma das vagas do piloto
            </a>

            <p className="text-sm text-slate-400 mt-3">
              Atendimento rápido pelo WhatsApp.
            </p>
          </div>

          <div className="bg-white/10 rounded-3xl p-8 border border-white/10">
            <div className="bg-slate-950 rounded-3xl p-6 text-center shadow-2xl">
              <p className="text-blue-300 font-bold mb-4">COMO FUNCIONA</p>

              <div className="grid gap-4 text-left">
                <div className="bg-slate-900 rounded-xl p-4">
                  1️⃣ Visitante escaneia o QR Code no portão
                </div>
                <div className="bg-slate-900 rounded-xl p-4">
                  2️⃣ Morador recebe a chamada no celular
                </div>
                <div className="bg-slate-900 rounded-xl p-4">
                  3️⃣ Atende de onde estiver
                </div>
                <div className="bg-slate-900 rounded-xl p-4">
                  4️⃣ Libera o acesso remotamente
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DOR */}
      <section className="bg-white text-slate-950 px-6 py-16">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">
            A maresia é implacável com equipamentos eletrônicos
          </h2>

          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-slate-100 rounded-2xl p-6">
              ❌ <strong>Interfones param de funcionar</strong>
              <p className="text-slate-600 mt-2">
                Falhas constantes e custo alto com manutenção.
              </p>
            </div>

            <div className="bg-slate-100 rounded-2xl p-6">
              ❌ <strong>Botões enferrujam rapidamente</strong>
              <p className="text-slate-600 mt-2">
                Dificuldade de uso e aparência ruim no condomínio.
              </p>
            </div>

            <div className="bg-slate-100 rounded-2xl p-6">
              ❌ <strong>Placas queimam com frequência</strong>
              <p className="text-slate-600 mt-2">
                Oxidação encurta a vida útil dos equipamentos.
              </p>
            </div>

            <div className="bg-slate-100 rounded-2xl p-6">
              ❌ <strong>Manutenção recorrente e cara</strong>
              <p className="text-slate-600 mt-2">
                Gasto que volta todos os anos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SOLUÇÃO */}
      <section className="bg-slate-50 text-slate-950 px-6 py-16">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">
            Menos hardware exposto. Mais tecnologia no celular.
          </h2>

          <div className="grid md:grid-cols-4 gap-6 text-center">
            <div className="bg-white rounded-2xl p-6 shadow">
              <div className="text-4xl mb-4">📱</div>
              <strong>Atendimento remoto</strong>
              <p className="text-slate-600 mt-2">
                O morador atende visitantes de onde estiver.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow">
              <div className="text-4xl mb-4">🚪</div>
              <strong>Abertura remota</strong>
              <p className="text-slate-600 mt-2">
                Liberação de acesso direto pelo celular.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow">
              <div className="text-4xl mb-4">🧂</div>
              <strong>Menos impacto da maresia</strong>
              <p className="text-slate-600 mt-2">
                Menos dependência de equipamentos externos complexos.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow">
              <div className="text-4xl mb-4">💰</div>
              <strong>Até 50% mais barato</strong>
              <p className="text-slate-600 mt-2">
                Comparado à portaria remota tradicional.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFÍCIOS */}
      <section className="bg-white text-slate-950 px-6 py-16">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">
            Ideal para condomínios do litoral
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
              ✅ Sem obras e sem passar cabos pelo condomínio
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
              ✅ Atendimento de visitantes, entregas e prestadores
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
              ✅ Mais praticidade para imóveis de praia
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
              ✅ Ótimo para moradores que ficam fora boa parte do ano
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="bg-gradient-to-r from-blue-950 to-slate-950 px-6 py-20 text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-6">
          Piloto em Guaratuba e litoral do Paraná
        </h2>

        <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-8">
          Estamos abrindo poucas vagas para condomínios participarem do piloto
          de lançamento.
        </p>

        <div className="grid md:grid-cols-4 gap-4 max-w-5xl mx-auto mb-10">
          <div className="bg-white/10 rounded-xl p-4">
            ✅ Sem instalação complexa
          </div>
          <div className="bg-white/10 rounded-xl p-4">✅ Sem cabeamento extra</div>
          <div className="bg-white/10 rounded-xl p-4">✅ Mais segurança</div>
          <div className="bg-white/10 rounded-xl p-4">✅ Suporte próximo</div>
        </div>

        <a
          href={whatsapp}
          target="_blank"
          rel="noreferrer"
          className="inline-block bg-green-500 hover:bg-green-600 px-10 py-5 rounded-xl text-xl font-bold"
        >
          Reservar uma das vagas do piloto
        </a>
      </section>

      {/* BOTÃO FIXO */}
      <a
        href={whatsapp}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-5 right-5 bg-green-500 hover:bg-green-600 px-5 py-4 rounded-full font-bold shadow-lg"
      >
        WhatsApp
      </a>
    </main>
  );
}