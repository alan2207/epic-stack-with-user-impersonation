import { type ActionArgs, type LoaderArgs, redirect } from '@remix-run/node'
import invariant from 'tiny-invariant'
import {
	IMPERSONATOR_SESSION_KEY,
	authenticator,
	getImpersonator,
} from '~/utils/auth.server.ts'
import { prisma } from '~/utils/db.server.ts'
import { requireAdmin } from '~/utils/permissions.server.ts'
import { commitSession, getSession } from '~/utils/session.server.ts'

export async function action({ request }: ActionArgs) {
	const body = await request.formData()
	const intent = body.get('intent') as string

	invariant(intent === 'start' || intent === 'stop', 'invalid intent')

	const cookieSession = await getSession(request.headers.get('cookie'))

	if (intent === 'start') {
		const userId = body.get('userId')?.toString()

		invariant(userId, 'Must provide a userId')

		const admin = await requireAdmin(request)

		invariant(userId !== admin.id, 'Self impersonation not allowed')

		const currentSessionId = cookieSession.get(authenticator.sessionKey)

		const impersonatorSession = await prisma.session.create({
			data: {
				userId: userId,
				expirationDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
			},
		})

		cookieSession.set(IMPERSONATOR_SESSION_KEY, currentSessionId)
		cookieSession.set(authenticator.sessionKey, impersonatorSession.id)
		const newCookie = await commitSession(cookieSession, {
			expires: impersonatorSession.expirationDate,
		})

		return redirect('/', {
			headers: { 'Set-Cookie': newCookie },
		})
	}

	if (intent === 'stop') {
		const impersonator = await getImpersonator(request)

		invariant(impersonator, 'Must be impersonating to stop impersonating')

		cookieSession.set(authenticator.sessionKey, impersonator.session.id)
		cookieSession.unset(IMPERSONATOR_SESSION_KEY)

		const newCookie = await commitSession(cookieSession, {
			expires: impersonator.session.expirationDate,
		})

		return redirect('/admin/users', {
			headers: { 'Set-Cookie': newCookie },
		})
	}
}

export async function loader({ request }: LoaderArgs) {
	const admin = requireAdmin(request)

	if (!admin) {
		return redirect('/')
	}

	return redirect('/admin/users')
}
