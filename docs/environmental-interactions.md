# Interações ambientais do exterior

As copas e a parte superior de grama, flores e arbustos reutilizam recortes do atlas atual. O movimento é de até 2 pixels, depende da proximidade dos pés e volta à posição original fora do alcance. Troncos e raízes ficam fixos; as duas partes usam a profundidade original. Terreno, posições, colisões, caminhos e interações foram preservados.

Peixes ambientais saltam a cada 2 segundos do relógio do mundo. Cada salto dura 680 ms no ar, seguido de respingos e uma ondulação que desaparece até 1280 ms. A seleção aleatória usa 20 pontos seguros derivados dos tiles, com direções, alturas, distâncias e três cores. O espaço de todo o arco e da ondulação exclui margem, píer, pedras, lírios e juncos. A animação não chama o controlador de pesca nem altera capturas.

Os postes têm pequenas quedas de brilho com longos intervalos estáveis. O brilho em pixels é rasterizado uma vez numa textura reutilizada nas trocas de cena. Os efeitos ambientais são atualizados a no máximo 20 quadros/s; copas, peixes, nuvens e luzes fora da câmera são ocultados. Movimento reduzido desativa esses movimentos e as variações de brilho, mantendo a iluminação de dia/noite. Mudanças da preferência do sistema são aplicadas durante o jogo.

O áudio do Phaser agora acompanha o botão de som e o volume existentes, com remoção da assinatura ao sair da cena. Os efeitos iniciais não acrescentavam sons; o som discreto das novas folhas está descrito abaixo.

## Validação

Passaram lint, checagem de tipos, build de produção, check:world e check:house. Os testes verificam percursos, acesso às 16 interações, pesca/cancelamento/conquistas, cada pixel de arcos e ondulações, profundidade dos recortes, preferência de movimento em tempo real, ausência de redesenho do lago fora da câmera, reutilização da textura e limpeza das assinaturas de áudio.

As prévias de composição de dia/noite e sequências de quadros foram inspecionadas. Para regenerar as imagens e animações sem alterar os arquivos de referência:

```powershell
node scripts/render-world-life-preview.mjs work/environment --motion
```

Os arquivos lake-day.webp, lake-night.webp, foliage-day.webp e foliage-night.webp ficam em work/environment. A reação da vegetação termina na metade das prévias.

A conferência no jogo em movimento continua pendente: o navegador integrado estava indisponível e a conexão de Computer Use ao Windows falhou. É necessário conferir câmera/zoom, passagem visual pela frente e por trás das árvores, fluidez em celular real, reprodução de áudio e controles de pesca no desktop e no celular, de dia e à noite.

Branch preservada: feat/exterior-tile-rebuild. estado-atual-mapa.patch manteve o SHA-256 AA8511A8BE03D578DF9AE285F8601F02477CF86A2510C7A300D727342B9C08BA. Nenhum commit ou push foi feito.

## Novos encontros e detalhes

Três borboletas ficam pousadas nas flores existentes durante o dia. Uma aproximação a menos de 62 pixels dos pés inicia um voo de 2,8 segundos que volta à mesma flor. Cada borboleta tem cor e direção próprias; não há voos contínuos enquanto o personagem fica parado perto delas.

Um sapo fica sobre a pedra shore-15 da margem oeste. Aproximar-se a menos de 72 pixels inicia um salto de 520 ms para um dos pontos já validados de água livre, com uma ondulação de 700 ms. Ele permanece escondido por pelo menos 14 segundos e só reaparece quando o personagem se afasta. A profundidade da pedra é considerada para que o sapo fique visível sobre ela. Nada é enviado ao controlador de pesca.

Ao caminhar perto dos troncos, dois pequenos pixels de folhas se deslocam por até um segundo, com intervalo mínimo de 900 ms. Folhas rosadas acompanham as árvores rosas. O som discreto reutiliza step-grass-02, com volume local 0,055 e velocidade 0,85; o gerenciador de áudio aplica o volume geral e o silêncio existentes.

Três grupos de até três vagalumes aparecem somente no período de noite. Cada luz aparece por 1,7 segundo em ciclos de 9 segundos, com fases diferentes e pausas sem luz. Borboletas, sapo, folhas e vagalumes usam poucas formas em pixels, sem novas imagens, corpos de física, partículas ou temporizadores. Atualizam a no máximo 20 quadros/s; desenhos pousados são reaproveitados e grupos fora da câmera não são redesenhados.

Movimento reduzido mantém borboletas e sapo pousados, desativa folhas e vagalumes e remove o som associado às folhas. As preferências podem mudar durante o jogo.

Na casa, E ou o botão de interação do celular permite examinar a mesa, a planta e a janela. São mensagens curtas, com seis segundos para leitura, sem pausar o personagem ou abrir painéis. As sete ações anteriores da casa e todos os objetos, posições e colisões continuam iguais. A verificação dos percursos agora considera a competição entre todas as dez interações.

Cantos fixos em pixels destacam a placa ou o baú selecionado no exterior, e o objeto selecionado na casa. O destaque usa o mesmo alvo do comando de interação, não pulsa e desaparece fora da câmera, durante pesca/descanso, com painéis abertos ou nas transições.

### Conferência dos encontros

check:world inclui check-environment-encounters.mjs: aproximação, retorno, pausas, ondulação inteira em água livre, intervalo do som das folhas, gráficos pousados sem redesenho, noite, movimento reduzido, câmera, geometria e limpeza. check:house testa o acesso às dez interações e os métodos reais da cena para os novos detalhes com ambos os personagens e interação por toque. Lint, checagem de tipos e build passaram.

As prévias usam instâncias persistentes do renderizador para registrar os encontros completos:

```powershell
node scripts/render-world-life-preview.mjs work/environment-encounters --motion
```

Além das imagens de composição, são gerados lake-day.webp, lake-night.webp, foliage-day.webp, foliage-night.webp, garden-day.webp e garden-night.webp. As sequências de quadros de dia/noite foram inspecionadas. A conferência no navegador continua pendente: o navegador integrado não expôs nenhuma sessão, e o Computer Use do Windows retornou “native pipe is unavailable” (os error 2). Ainda é necessário conferir no jogo real o áudio, o contraste dos pequenos sprites, os destaques na casa e a fluidez em desktop/celular, de dia e à noite.

Nenhum commit ou push foi feito. estado-atual-mapa.patch permanece preservado.
