import { type LoaderArgs, json } from '@remix-run/node'
import { Form, useLoaderData } from '@remix-run/react'
import { Button } from '~/components/ui/button.tsx'
import { getImpersonator } from '~/utils/auth.server.ts'
import { prisma } from '~/utils/db.server.ts'
import { requireAdmin } from '~/utils/permissions.server.ts'
import { useUser } from '~/utils/user.ts'

export async function loader({ request }: LoaderArgs) {
	await requireAdmin(request)

	const users = await prisma.user.findMany({
		include: {
			roles: true,
		},
	})

	const impersonator = await getImpersonator(request)

	const isImpersonating = !!impersonator?.session?.id

	return json({
		users,
		canImpersonate: !isImpersonating,
	})
}

function Users() {
	const currentUser = useUser()
	const { users, canImpersonate } = useLoaderData<typeof loader>()

	return (
		<div className="flex flex-col items-center gap-10">
			<h1 className="mx-auto max-w-xl text-2xl font-bold">Users</h1>
			<table className="mx-auto border-collapse">
				<thead>
					<tr>
						<th className=" p-4 text-left">Name</th>
						<th className=" p-4 text-left">Email</th>
						<th className=" p-4 text-left">Username</th>
						<th className=" p-4 text-left">Roles</th>
						<th className=" p-4 text-left">Impersonate</th>
					</tr>
				</thead>
				<tbody>
					{users.map(user => (
						<tr className="" key={user.id}>
							<td className=" p-4">{user.name}</td>
							<td className=" p-4">{user.email}</td>
							<td className=" p-4">{user.username}</td>
							<td className=" p-4">
								{user.roles.map(role => role.name).join(', ')}
							</td>
							{canImpersonate && currentUser.id !== user.id && (
								<td className="p-4">
									<Form method="post" action="/impersonate" className="flex">
										<input type="hidden" name="intent" value="start" />
										<input type="hidden" name="userId" value={user.id} />
										<Button type="submit">Impersonate</Button>
									</Form>
								</td>
							)}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	)
}

export default Users
