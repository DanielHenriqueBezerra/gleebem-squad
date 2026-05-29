# Gleebem Wellness App

Módulo funcional de escaneamento de saúde (Health Scan) construído em React Native (Expo) para integração com o Shen.ai SDK e armazenamento de resultados no Firebase Firestore.

## 🚀 Tecnologias Integradas
- **React Native 0.81** com **React 19**
- **Expo SDK 54** (Suporte a iOS, Android e Web)
- **React Navigation Stack** (Navegação customizada)
- **Firebase/Firestore SDK** (Banco de dados e LGPD)
- **Shen.ai SDK 3.0.12** (Medição de sinais vitais via câmera — rPPG)

## 📦 Como baixar e rodar na sua máquina

### 1. Clonar o projeto
Faça o clone no repositório oficial do Github:
```bash
git clone https://github.com/jeffjr007/gleebem-squad.git
cd gleebem-squad
```

### 2. Instalar as dependências
Certifique-se de que o [Node.js](https://nodejs.org/) está instalado na sua máquina e rode:
```bash
npm install
```

### 3. Configurar Variáveis de Ambiente (.env)
Crie um arquivo chamado `.env` na raiz do projeto baseado no arquivo `.env.example` e insira suas chaves:

```env
# Firebase Connection Keys
EXPO_PUBLIC_FIREBASE_API_KEY=sua_api_key_aqui
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=seu_projeto
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=seu_projeto.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=seu_app_id

# Shen.ai Key
EXPO_PUBLIC_SHENAI_API_KEY=sua_chave_shenai_de_producao
```

### 4. Configurar a Dependência Nativa — Shen.ai SDK (.aar)

> ⚠️ **Obrigatório para o build Android funcionar.**

O arquivo binário do Shen.ai SDK **não está incluso no repositório** (está no `.gitignore`). Você deve obtê-lo manualmente:

1. Acesse o portal [developer.shen.ai](https://developer.shen.ai) e baixe o SDK na versão **exata 3.0.12** para Android
2. Localize o arquivo `shenai_sdk.aar` dentro do pacote baixado
3. Crie o diretório (se não existir) e coloque o arquivo em:
   ```
   react-native-shenai-sdk/android/libs/shenai_sdk.aar
   ```

### 5. Instalar o NDK 29 no Android Studio

O SDK do Shen.ai 3.0.12 foi compilado contra o **NDK 29.0.14206865**. O `android/build.gradle` já está configurado com essa versão — você só precisa instalá-la:

1. Abra o **Android Studio**
2. Vá em **SDK Manager → SDK Tools**
3. Marque **"Show Package Details"** (canto inferior direito)
4. Em **NDK (Side by Side)**, marque a versão `29.0.14206865`
5. Clique em **Apply** e aguarde o download

### 6. Rodar o App

**🔗 Download Direto do APK (Android)**
Para quem for apenas testar (sem rodar código local):
[**Acessar pasta no Drive**](https://drive.google.com/drive/folders/18StK9mEANxOUIPMQZitsvptoSX1dYyiU)

---

**Para desenvolvedores — rodar na Web (visualização apenas):**
```bash
npx expo start --web
```
> ⚠️ Na web o escaneamento **não funciona** — o SDK depende de código nativo C++.

**Para testar o SDK real no celular (build nativo):**

**Requisitos:**
- **Java JDK 17** com `JAVA_HOME` configurado
- **Android Studio** com `ANDROID_HOME` configurado (ex: `C:\Users\SEU_USUARIO\AppData\Local\Android\Sdk`)
- **Depuração USB** ativada no celular (Configurações → Sobre → toque 7x em "Número da Versão" → Opções do Desenvolvedor → Depuração USB)
- Celular conectado via USB com acesso autorizado

Com tudo configurado:
```bash
npx expo run:android
```
O Gradle vai compilar o código nativo (~5–10 min na primeira vez), instalar o APK via ADB e abrir o app automaticamente.

### 💡 Dicas Vitais para o Teste do Shen.ai
1. **Fique de frente para a luz:** O algoritmo rPPG precisa ver o sangue pulsando no rosto. De costas para a luz aparece o erro "Contraluz" e o cronômetro pausa.
2. **Tempo de medição:** A barra de progresso leva exatamente **30 segundos**. Não fale e não mexa o rosto.
3. **Se travar no final:** Verifique se as chaves do Firebase estão corretas no `.env`.

## 🗄 Banco de Dados (Firebase Firestore)
O app salva automaticamente os dados no Firestore em `/users/{uid}/wellness_tests`.

### Regras do Firestore

**Para testes (sem autenticação):**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**Para produção (após integrar Login):**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 🔧 Solução de Problemas Conhecidos

### ADB não encontrado ao rodar `npx expo run:android`
**Erro:** `adb: line 3: /usr/bin/adb: No such file or directory`

Isso acontece quando existe um shell script chamado `adb` no lugar do executável real. Corrija:
```powershell
# No PowerShell (como Administrador)
Rename-Item "$env:ANDROID_HOME\platform-tools\adb.exe.bak" -NewName "adb.exe"
Remove-Item "$env:ANDROID_HOME\platform-tools\adb" -Force
```

---

### "Unable to load script" ao abrir o app no celular
O celular não está conseguindo se conectar ao Metro bundler no PC. Execute após o app abrir:
```bash
adb reverse tcp:8081 tcp:8081
```
Depois pressione **R, R** no celular para recarregar.

> **Se tiver WSL configurado com portproxy na porta 8081**, o túnel ADB será interceptado. Remova a regra (PowerShell como Administrador):
> ```powershell
> netsh interface portproxy delete v4tov4 listenaddress=127.0.0.1 listenport=8081
> ```

---

### Build falha com erro de linker C++ (`undefined symbol: operator new`)
**Causa:** incompatibilidade de versão do NDK ou do `.aar`.

Verifique:
1. O NDK **29.0.14206865** está instalado (ver Passo 5 acima)
2. O arquivo `shenai_sdk.aar` é da versão **3.0.12** do SDK (não 3.1.0 ou outra)
3. Limpe o cache e rebuilde:
   ```bash
   cd android && ./gradlew clean && cd .. && npx expo run:android
   ```
