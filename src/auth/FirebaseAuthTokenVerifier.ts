import { Injectable, UnauthorizedException } from '@nestjs/common';
import { applicationDefault, cert, getApps, initializeApp, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { AuthTokenVerifierPort, VerifiedIdentity } from './AuthTokenVerifierPort';

/**
 * ⚠️ NOTA DE ESTADO: no fue posible probar esta clase en ejecución real en
 * el entorno donde se escribió (no hay proyecto Firebase real disponible ni
 * acceso de red a los servidores de verificación de Google desde este
 * sandbox). El código usa la API modular de firebase-admin (v14); falta
 * probarlo con un ID token real emitido por el SDK cliente de Firebase.
 *
 * Credenciales: se admiten dos formas, en este orden de prioridad:
 *   1) Variables de entorno sueltas (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL,
 *      FIREBASE_PRIVATE_KEY) — la forma recomendada en plataformas serverless
 *      como Vercel, donde no hay un sistema de archivos persistente cómodo
 *      para apuntar GOOGLE_APPLICATION_CREDENTIALS a un .json.
 *   2) applicationDefault() (vía GOOGLE_APPLICATION_CREDENTIALS apuntando a
 *      un archivo, o credenciales implícitas de Google Cloud) — útil en
 *      desarrollo local o en plataformas con filesystem persistente.
 */
@Injectable()
export class FirebaseAuthTokenVerifier implements AuthTokenVerifierPort {
  private app: App;

  constructor() {
    const apps = getApps();
    if (apps.length) {
      this.app = apps[0];
      return;
    }

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    // En variables de entorno los saltos de línea de la clave privada suelen
    // llegar escapados como "\n" literal; hay que des-escaparlos o
    // firebase-admin rechaza la clave como inválida.
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (projectId && clientEmail && privateKey) {
      this.app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
    } else {
      this.app = initializeApp({ credential: applicationDefault() });
    }
  }

  async verify(idToken: string): Promise<VerifiedIdentity> {
    try {
      const decoded = await getAuth(this.app).verifyIdToken(idToken);
      return { uid: decoded.uid, email: decoded.email ?? null };
    } catch (e) {
      throw new UnauthorizedException('Token de autenticación inválido o expirado');
    }
  }
}
