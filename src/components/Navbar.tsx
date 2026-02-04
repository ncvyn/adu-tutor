import { Link } from '@tanstack/solid-router'

export const Navbar = () => {
  return (
    <div class="navbar hidden bg-base-300 shadow-sm xl:flex">
      <div class="navbar-start">
        <a class="btn text-xl btn-ghost">AdU-Tutor</a>
      </div>
      <div class="navbar-center">
        <ul class="menu menu-horizontal">
          <li>
            <Link to="/messages" class="btn btn-ghost select-none">
              Messages
            </Link>
          </li>
          <li>
            <Link to="/info-hub" class="btn btn-ghost select-none">
              Info Hub
            </Link>
          </li>
        </ul>
      </div>
      <div class="navbar-end">
        <Link to="/profile" class="btn select-none">
          Profile
        </Link>
      </div>
    </div>
  )
}
