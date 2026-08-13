# Roteiro de QA auditivo

Em desenvolvimento, abra `/dev/audio-qa`. Cada nova reprodução deve substituir a anterior.

## Fone

- validar volume inicial, ausência de clicks, ataque, release e distância entre notas;
- comparar tom, semitom, sequência e escala sem fadiga.

## Alto-falante do celular

- validar inteligibilidade, volume, harmônicos e distinção entre graves/agudos.

## Safari/iOS

- testar primeiro play após gesto, bloqueio e desbloqueio, background e retorno, troca de aba e segunda reprodução;
- o navegador pode suspender o `AudioContext`; a próxima interação deve retomá-lo.

## Chrome desktop

- testar sequência, replay rápido, atalhos, troca de rota e cancelamento.

Não aprovar qualidade de timbre apenas pelos testes automatizados.
